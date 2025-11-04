import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

interface RateLimitEntry {
  identifier: string;
  count: number;
  resetAt: Date;
  type: "ip" | "user";
}

const GUEST_LIMITS = {
  uploadsPerHour: 10,
  uploadsPerDay: 50,
  uploadsPerMonth: 200,
};

const USER_LIMITS = {
  free: {
    uploadsPerHour: 20,
    uploadsPerDay: 100,
  },
  starter: {
    uploadsPerHour: 50,
    uploadsPerDay: 1000,
  },
  pro: {
    uploadsPerHour: 200,
    uploadsPerDay: 10000,
  },
  enterprise: {
    uploadsPerHour: -1,
    uploadsPerDay: -1,
  },
};

const rateLimitCache = new Map<string, RateLimitEntry>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIP || request.ip || "unknown";
  return ip;
}

function isUnlimited(value: number): boolean {
  return value === -1;
}

async function getRateLimitFromDB(identifier: string, type: "ip" | "user"): Promise<RateLimitEntry | null> {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) return null;

    const collection = db.collection("rateLimits");
    const entry = await collection.findOne({ identifier, type });
    
    if (entry) {
      return {
        identifier: entry.identifier,
        count: entry.count,
        resetAt: entry.resetAt,
        type: entry.type,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function saveRateLimitToDB(entry: RateLimitEntry): Promise<void> {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) return;

    const collection = db.collection("rateLimits");
    await collection.updateOne(
      { identifier: entry.identifier, type: entry.type },
      { $set: entry },
      { upsert: true }
    );
  } catch (error) {
  }
}

async function checkRateLimit(
  identifier: string,
  type: "ip" | "user",
  plan: "free" | "starter" | "pro" | "enterprise" = "free",
  isGuest: boolean = false
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const cacheKey = `${type}:${identifier}`;

  let entry = rateLimitCache.get(cacheKey);
  
  if (!entry) {
    const dbEntry = await getRateLimitFromDB(identifier, type);
    if (dbEntry) {
      entry = dbEntry;
      rateLimitCache.set(cacheKey, entry);
    }
  }

  const limits = isGuest 
    ? GUEST_LIMITS 
    : USER_LIMITS[plan];

  const hourLimit = isGuest ? GUEST_LIMITS.uploadsPerHour : USER_LIMITS[plan].uploadsPerHour;
  const dayLimit = isGuest ? GUEST_LIMITS.uploadsPerDay : USER_LIMITS[plan].uploadsPerDay;

  const nowHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!entry || entry.resetAt < now) {
    entry = {
      identifier,
      count: 0,
      resetAt: new Date(nowHour.getTime() + 60 * 60 * 1000),
      type,
    };
    rateLimitCache.set(cacheKey, entry);
    await saveRateLimitToDB(entry);
  }

  if (entry.resetAt < now) {
    entry.count = 0;
    entry.resetAt = new Date(nowHour.getTime() + 60 * 60 * 1000);
    rateLimitCache.set(cacheKey, entry);
    await saveRateLimitToDB(entry);
  }

  if (!isUnlimited(hourLimit) && entry.count >= hourLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  rateLimitCache.set(cacheKey, entry);
  await saveRateLimitToDB(entry);

  return {
    allowed: true,
    remaining: isUnlimited(hourLimit) ? -1 : hourLimit - entry.count,
    resetAt: entry.resetAt,
  };
}

export async function checkUploadRateLimit(
  request: NextRequest,
  userId: string | null,
  plan: "free" | "starter" | "pro" | "enterprise" = "free"
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; error?: string }> {
  const ip = getClientIP(request);
  
  if (userId) {
    const userLimit = await checkRateLimit(userId, "user", plan, false);
    if (!userLimit.allowed) {
      return {
        ...userLimit,
        error: `Rate limit exceeded. Please try again after ${userLimit.resetAt.toISOString()}`,
      };
    }
  }

  const ipLimit = await checkRateLimit(ip, "ip", plan, !userId);
  if (!ipLimit.allowed) {
    return {
      ...ipLimit,
      error: `Rate limit exceeded. Please try again after ${ipLimit.resetAt.toISOString()}`,
    };
  }

  return ipLimit;
}

