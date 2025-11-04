import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Image from "@/models/Image";
import { getPlanLimits, type PlanType } from "@/lib/plans";
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const usersCollection = db.collection(User.collection.name);
    const user = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { plan: 1 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = (user.plan || "free") as PlanType;
    const limits = getPlanLimits(plan);

    const imagesCollection = db.collection(Image.collection.name);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const uploadsThisMonth = await imagesCollection.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      uploadedAt: { $gte: startOfMonth },
    });

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

    return NextResponse.json({
      plan,
      limits,
      usage: {
        uploadsThisMonth,
        storageUsedGB,
        storageLimitGB: limits.storageGB,
        storageUsagePercent: limits.storageGB === -1 ? 0 : (storageUsedGB / limits.storageGB) * 100,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get plan stats" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !["free", "starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const usersCollection = db.collection(User.collection.name);
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { plan } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}

