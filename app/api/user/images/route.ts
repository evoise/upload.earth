import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Image from "@/models/Image";

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const images = await Image.find({ userId })
      .sort({ uploadedAt: -1 })
      .select("fileName uploadedAt hasPassword expiresAt")
      .lean();

    const imagesWithUrls = images.map((img) => ({
      fileName: img.fileName,
      url: `/image/${img.fileName}`,
      uploadedAt: img.uploadedAt,
      hasPassword: img.hasPassword,
      expiresAt: img.expiresAt,
    }));

    return NextResponse.json({ images: imagesWithUrls }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

