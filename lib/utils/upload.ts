import { type Language } from "@/lib/translations";

interface UploadOptions {
  customFileName?: string;
  retentionTime?: number;
  retentionMode?: "preset" | "custom";
  customRetentionHours?: string;
  imagePassword?: string;
  confirmImagePassword?: string;
  language: Language;
  onProgress?: (progress: number) => void;
  onFileProgress?: (fileIndex: number, total: number, progress: number) => void;
}

interface UploadResult {
  url: string;
  fileName: string;
  hasPassword?: boolean;
}

export const uploadSingleFile = async (
  file: File,
  index: number,
  total: number,
  options: UploadOptions
): Promise<UploadResult | null> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    if (options.customFileName && options.customFileName.trim()) {
      formData.append("customFileName", options.customFileName.trim());
    }

    let finalRetentionTime = options.retentionTime || 0;
    if (options.retentionMode === "custom" && options.customRetentionHours) {
      const hours = Number(options.customRetentionHours);
      if (hours > 0) {
        finalRetentionTime = hours * 3600;
      }
    }

    if (finalRetentionTime > 0) {
      formData.append("retentionTime", finalRetentionTime.toString());
    }

    if (options.imagePassword && options.imagePassword.trim()) {
      if (options.imagePassword !== options.confirmImagePassword) {
        reject(new Error("Passwords do not match"));
        return;
      }
      formData.append("password", options.imagePassword.trim());
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && total === 1 && options.onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        options.onProgress(percentComplete);
      } else if (e.lengthComputable && options.onFileProgress) {
        const fileProgress = Math.round((e.loaded / e.total) * 100);
        const overallProgress = Math.round(((index - 1) * 100 + fileProgress) / total);
        options.onFileProgress(index, total, overallProgress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({ 
          url: `/image/${response.fileName}`, 
          fileName: response.fileName,
          hasPassword: !!(options.imagePassword && options.imagePassword.trim())
        });
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.error || "Upload failed"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error occurred"));
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
};

