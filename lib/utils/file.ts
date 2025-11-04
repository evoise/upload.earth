import { type Language } from "@/lib/translations";
import { getBaseUrl } from "./url";

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

export const formatDate = (timestamp: number, language: Language): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(language === "en" ? "en-US" : language === "fr" ? "fr-FR" : "tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const shareUrl = (url: string, platform: string): void => {
  const fullUrl = `${getBaseUrl()}${url}`;
  
  const encodedUrl = encodeURIComponent(fullUrl);
  let shareUrl = "";
  
  switch (platform) {
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}`;
      break;
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
    case "whatsapp":
      shareUrl = `https://wa.me/?text=${encodedUrl}`;
      break;
    case "telegram":
      shareUrl = `https://t.me/share/url?url=${encodedUrl}`;
      break;
    default:
      return;
  }
  
  window.open(shareUrl, "_blank", "width=600,height=400");
};

