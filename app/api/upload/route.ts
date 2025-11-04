import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import connectDB from "@/lib/mongodb";
import Image from "@/models/Image";
import User from "@/models/User";
import { getPlanLimits, isUnlimited } from "@/lib/plans";
import mongoose from "mongoose";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";
import { checkUploadRateLimit } from "@/lib/rateLimit";
import { s3Client, checkBucketSizeLimit } from "@/lib/s3";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIP || request.ip || "unknown";
  return ip;
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let plan: "free" | "starter" | "pro" | "enterprise" = "free";
    let isAuthenticated = false;

    const cookieUserId = request.cookies.get("userId")?.value;
    let token = request.cookies.get("authToken")?.value;

    if (!token) {
      const tokenFromHeader = getTokenFromRequest(request);
      if (tokenFromHeader) {
        token = tokenFromHeader;
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === "user") {
        userId = decoded.userId;
        isAuthenticated = true;
      }
    }

    if (!userId && cookieUserId) {
      userId = cookieUserId;
      isAuthenticated = true;
    }

    if (!userId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const apiKey = authHeader.substring(7);
        await connectDB();
        const db = mongoose.connection.db;
        if (db) {
          const usersCollection = db.collection(User.collection.name);
          const user = await usersCollection.findOne(
            { apiKey: apiKey },
            { projection: { _id: 1, plan: 1 } }
          );
          if (user) {
            userId = user._id.toString();
            plan = (user.plan || "free") as "free" | "starter" | "pro" | "enterprise";
            isAuthenticated = true;
          }
        }
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customFileName = formData.get("customFileName") as string | null;
    const retentionTime = formData.get("retentionTime") as string | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "File buffer is empty" },
        { status: 400 }
      );
    }

    const magicBytes = buffer.slice(0, 4);
    const isValidImage = 
      (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) ||
      (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) ||
      (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46) ||
      (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50);

    if (!isValidImage) {
      return NextResponse.json(
        { error: "File is not a valid image. Magic bytes validation failed." },
        { status: 400 }
      );
    }

    const rateLimitCheck = await checkUploadRateLimit(request, userId, plan);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error || "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const bucketSizeCheck = await checkBucketSizeLimit(file.size);
    if (!bucketSizeCheck.allowed) {
      return NextResponse.json(
        { error: bucketSizeCheck.error || "Bucket storage limit exceeded" },
        { status: 507 }
      );
    }

    if (userId) {
      if (!mongoose.connection.readyState) {
        await connectDB();
      }
      
      const db = mongoose.connection.db;
      if (!db) {
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
      }

      const usersCollection = db.collection(User.collection.name);
      const user = await usersCollection.findOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { projection: { plan: 1 } }
      );

      if (user) {
        plan = (user.plan || "free") as "free" | "starter" | "pro" | "enterprise";
        const limits = getPlanLimits(plan);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const imagesCollection = db.collection(Image.collection.name);
        const uploadsThisMonth = await imagesCollection.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
          uploadedAt: { $gte: startOfMonth },
        });

        if (!isUnlimited(limits.uploadsPerMonth) && uploadsThisMonth >= limits.uploadsPerMonth) {
          return NextResponse.json(
            { error: `Monthly upload limit reached (${limits.uploadsPerMonth} uploads). Please upgrade your plan.` },
            { status: 403 }
          );
        }

        let totalStorageBytes = 0;
        const userImages = await imagesCollection.find(
          { userId: new mongoose.Types.ObjectId(userId) },
          { projection: { fileName: 1 } }
        ).toArray();

        for (const image of userImages) {
          try {
            const headCommand = new HeadObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME || "",
              Key: image.fileName,
            });
            const headResult = await s3Client.send(headCommand);
            if (headResult.ContentLength) {
              totalStorageBytes += headResult.ContentLength;
            }
              } catch (error) {
              }
        }

        const storageUsedGB = totalStorageBytes / (1024 * 1024 * 1024);
        const fileSizeGB = file.size / (1024 * 1024 * 1024);
        const newTotalStorageGB = storageUsedGB + fileSizeGB;

        if (!isUnlimited(limits.storageGB) && newTotalStorageGB > limits.storageGB) {
          return NextResponse.json(
            { error: `Storage limit exceeded. You have ${limits.storageGB}GB storage. Please upgrade your plan or delete some images.` },
            { status: 403 }
          );
        }
      }
    }

    let fileName: string;
    if (customFileName && customFileName.trim()) {
      const sanitized = customFileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
      const extension = file.name.split(".").pop() || "";
      fileName = `${sanitized}-${randomBytes(8).toString("hex")}.${extension}`;
    } else {
      fileName = `${randomBytes(16).toString("hex")}-${file.name}`;
    }

    const metadata: Record<string, string> = {};
    if (retentionTime && Number(retentionTime) > 0) {
      const expiryDate = new Date(Date.now() + Number(retentionTime) * 1000);
      metadata["expires-at"] = expiryDate.toISOString();
    }
    if (password && password.trim()) {
      metadata["password"] = password.trim();
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    await s3Client.send(command);

    const imageUrl = `/api/image/${fileName}`;

    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || null;
    const referer = request.headers.get("referer") || null;
    const uploadMethod = isAuthenticated ? (token ? "api" : "site") : "site";

    await connectDB();
    const expiresAt = metadata["expires-at"] ? new Date(metadata["expires-at"]) : null;
    
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const imagesCollection = db.collection(Image.collection.name);
    
    const imageData: any = {
      fileName,
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      uploadedAt: new Date(),
      hasPassword: !!password,
      expiresAt,
      ipAddress,
      userAgent,
      referer,
      uploadMethod,
      fileSize: file.size,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await imagesCollection.insertOne(imageData);

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName: fileName,
      expiresAt: metadata["expires-at"] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

