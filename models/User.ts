import mongoose, { Schema, Document, Model } from 'mongoose';

export type PlanType = "free" | "starter" | "pro" | "enterprise";

export interface IUser extends Document {
  email: string;
  password: string;
  avatarUrl?: string;
  apiKey?: string;
  plan?: PlanType;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
    },
    apiKey: {
      type: String,
    },
    plan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

