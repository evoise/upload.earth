import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Image from "@/models/Image";
import mongoose from "mongoose";

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
    const admin = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { isAdmin: 1 } }
    );

    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const imagesCollection = db.collection(Image.collection.name);
    const { searchParams } = new URL(request.url);
    const userFilter = searchParams.get("userId");

    let query: any = {};
    if (userFilter) {
      query.userId = new mongoose.Types.ObjectId(userFilter);
    }

    const images = await imagesCollection.find(query)
      .sort({ uploadedAt: -1 })
      .limit(1000)
      .toArray();

    const origin = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || request.headers.get('origin') || request.nextUrl.origin;

    const imagesWithUser = await Promise.all(
      images.map(async (image) => {
        const user = await usersCollection.findOne(
          { _id: image.userId },
          { projection: { email: 1 } }
        );

        return {
          id: image._id.toString(),
          fileName: image.fileName,
          url: `${origin}/api/image/${image.fileName}`,
          userId: image.userId.toString(),
          userEmail: user?.email || "Unknown",
          uploadedAt: image.uploadedAt,
          hasPassword: image.hasPassword || false,
          expiresAt: image.expiresAt || null,
        };
      })
    );

    return NextResponse.json({ images: imagesWithUser }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch images" },
      { status: 500 }
    );
  }
}

