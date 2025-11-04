import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IImage extends Document {
  fileName: string;
  userId?: mongoose.Types.ObjectId | null;
  uploadedAt: Date;
  hasPassword: boolean;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  uploadMethod?: string;
  fileSize?: number;
}

const ImageSchema: Schema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    referer: {
      type: String,
      default: null,
    },
    uploadMethod: {
      type: String,
      enum: ["site", "api"],
      default: "site",
    },
    fileSize: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Image: Model<IImage> = mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);

export default Image;

