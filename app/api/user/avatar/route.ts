import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const encodedFileName = encodeURIComponent(fileName);
    const avatarUrl = `/api/image/${encodedFileName}`;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const collectionName = User.collection.name;
    const usersCollection = db.collection(collectionName);
    
    const objectId = new mongoose.Types.ObjectId(userId);
    
    const result = await usersCollection.updateOne(
      { _id: objectId },
      { $set: { avatarUrl } }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    
    const updatedUser = await usersCollection.findOne(
      { _id: objectId },
      { projection: { avatarUrl: 1 } }
    );

    if (!updatedUser || !updatedUser.avatarUrl) {
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
    }

    return NextResponse.json({ avatarUrl: updatedUser.avatarUrl }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

