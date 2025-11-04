export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  return process.env.NODE_ENV === "production"
    ? "https://upload.earth"
    : "http://localhost:3000";
}

export function getApiUrl(path: string = ""): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getImageUrl(fileName: string): string {
  return getApiUrl(`/api/image/${encodeURIComponent(fileName)}`);
}

