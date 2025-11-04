import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { getPlanLimits } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId).select('apiKey');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ apiKey: user.apiKey || null }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection(User.collection.name);
    const user = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { apiKey: 1, plan: 1 } }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = (user.plan || "free") as "free" | "starter" | "pro" | "enterprise";
    const limits = getPlanLimits(plan);

    if (limits.apiRequestsPerMonth === 0) {
      return NextResponse.json({ error: "API access is not available on your current plan. Please upgrade to Starter plan or higher." }, { status: 403 });
    }

    if (!user.apiKey) {
      const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
      
      const db = mongoose.connection.db;
      if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }
      
      const collectionName = User.collection.name;
      const usersCollection = db.collection(collectionName);
      
      const objectId = new mongoose.Types.ObjectId(userId);
      
      const result = await usersCollection.updateOne(
        { _id: objectId },
        { $set: { apiKey } }
      );

      if (result.modifiedCount === 0 && result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedUser = await usersCollection.findOne(
        { _id: objectId },
        { projection: { apiKey: 1 } }
      );

      if (!updatedUser || !updatedUser.apiKey) {
        return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
      }

      return NextResponse.json({ apiKey: updatedUser.apiKey }, { status: 200 });
    }

    return NextResponse.json({ apiKey: user.apiKey }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate API key', details: error.message }, { status: 500 });
  }
}

