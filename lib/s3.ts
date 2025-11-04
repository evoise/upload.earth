import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function getBucketTotalSize(): Promise<number> {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "";
    let totalSize = 0;
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Size) {
            totalSize += object.Size;
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return totalSize;
  } catch (error) {
    throw error;
  }
}

export async function checkBucketSizeLimit(fileSize: number): Promise<{ allowed: boolean; error?: string; currentSizeGB?: number; maxSizeGB?: number }> {
  try {
    const maxBucketSizeGB = parseFloat(process.env.MAX_BUCKET_SIZE_GB || "0");
    
    if (maxBucketSizeGB <= 0) {
      return { allowed: true };
    }

    const currentTotalSize = await getBucketTotalSize();
    const currentSizeGB = currentTotalSize / (1024 * 1024 * 1024);
    const maxSizeBytes = maxBucketSizeGB * 1024 * 1024 * 1024;
    const newTotalSize = currentTotalSize + fileSize;

    if (newTotalSize > maxSizeBytes) {
      return {
        allowed: false,
        error: `Bucket storage limit exceeded. Current: ${currentSizeGB.toFixed(2)}GB, Max: ${maxBucketSizeGB}GB. Please contact administrator.`,
        currentSizeGB,
        maxSizeGB: maxBucketSizeGB,
      };
    }

    return {
      allowed: true,
      currentSizeGB,
      maxSizeGB: maxBucketSizeGB,
    };
  } catch (error) {
    return {
      allowed: false,
      error: "Failed to check bucket size limit",
    };
  }
}

export { s3Client };

