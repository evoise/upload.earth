import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    let userId = request.cookies.get('userId')?.value;
    let token: string | null = request.cookies.get('authToken')?.value || null;

    if (!token) {
      token = getTokenFromRequest(request);
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === "user") {
        userId = decoded.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const collectionName = User.collection.name;
    const usersCollection = db.collection(collectionName);
    
        const user = await usersCollection.findOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { projection: { email: 1, avatarUrl: 1, apiKey: 1, plan: 1, isAdmin: 1 } }
        );

    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('userId');
      return response;
    }

        return NextResponse.json(
          { user: { id: userId, email: user.email, avatarUrl: user.avatarUrl || null, apiKey: user.apiKey || null, plan: user.plan || "free", isAdmin: user.isAdmin || false } },
          { status: 200 }
        );
  } catch (error: any) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

