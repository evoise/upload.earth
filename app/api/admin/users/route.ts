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

    const users = await usersCollection.find(
      {},
      { projection: { email: 1, plan: 1, isAdmin: 1, createdAt: 1, avatarUrl: 1 } }
    ).toArray();

    const imagesCollection = db.collection(Image.collection.name);
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const imageCount = await imagesCollection.countDocuments({
          userId: user._id,
        });

        return {
          id: user._id.toString(),
          email: user.email,
          plan: user.plan || "free",
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt,
          avatarUrl: user.avatarUrl || null,
          imageCount,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
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

    const { targetUserId, plan, isAdmin } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (plan !== undefined) {
      if (!["free", "starter", "pro", "enterprise"].includes(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      updateData.plan = plan;
    }
    if (isAdmin !== undefined) {
      updateData.isAdmin = Boolean(isAdmin);
    }

    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetUserId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

