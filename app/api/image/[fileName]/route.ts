import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    let fileName = params.fileName;

    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    fileName = decodeURIComponent(fileName);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: fileName,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const metadata = response.Metadata || {};
    const storedPassword = metadata["password"];

    if (storedPassword) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || authHeader !== `Bearer ${storedPassword}`) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 }
        );
      }
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const contentType = response.ContentType || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch image" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    let fileName = params.fileName;
    const body = await request.json();
    const { password } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    fileName = decodeURIComponent(fileName);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: fileName,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const metadata = response.Metadata || {};
    const storedPassword = metadata["password"];

    if (!storedPassword) {
      return NextResponse.json(
        { error: "No password required" },
        { status: 400 }
      );
    }

    if (password !== storedPassword) {
      return NextResponse.json(
        { error: "Wrong password" },
        { status: 401 }
      );
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const contentType = response.ContentType || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch image" },
      { status: 500 }
    );
  }
}
