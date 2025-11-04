"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { translations, type Language } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import RecentUploadsPanel from "@/components/RecentUploadsPanel";
import AuthDialogs from "@/components/AuthDialogs";
import UploadCard from "@/components/UploadCard";
import UploadResults from "@/components/UploadResults";
import LanguageSelector from "@/components/LanguageSelector";
import UploadCount from "@/components/UploadCount";
import { formatDate } from "@/lib/utils/file";
import { uploadSingleFile } from "@/lib/utils/upload";
import { getBaseUrl, getImageUrl } from "@/lib/utils/url";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<Array<{ url: string; fileName: string; hasPassword?: boolean }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploadCount, setUploadCount] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [customFileName, setCustomFileName] = useState<string>("");
  const [retentionTime, setRetentionTime] = useState<number>(0);
  const [retentionMode, setRetentionMode] = useState<"preset" | "custom">("preset");
  const [customRetentionHours, setCustomRetentionHours] = useState<string>("");
  const [imagePassword, setImagePassword] = useState<string>("");
  const [confirmImagePassword, setConfirmImagePassword] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState<{ [key: number]: boolean }>({});
  const [showImageInfo, setShowImageInfo] = useState<{ [key: number]: boolean }>({});
  const [showShareMenu, setShowShareMenu] = useState<{ [key: number]: boolean }>({});
  const [shareMenuPosition, setShareMenuPosition] = useState<{ [key: number]: { top: number; left: number } }>({});
  const [imageMetadata, setImageMetadata] = useState<{ [key: string]: { width: number; height: number; size: number; format: string } }>({});
  const [recentUploads, setRecentUploads] = useState<Array<{ url: string; fileName: string; timestamp: number; hasPassword?: boolean }>>([]);
  const [showRecentUploads, setShowRecentUploads] = useState(false);
  const [loadingRecentUploads, setLoadingRecentUploads] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const { toast } = useToast();

  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    const cookieTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1];

    const initialTheme = cookieTheme === "dark" || (!cookieTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (initialTheme) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const cookieLanguage = document.cookie
      .split("; ")
      .find((row) => row.startsWith("language="))
      ?.split("=")[1] as Language | undefined;

    if (cookieLanguage && ["en", "fr", "tr"].includes(cookieLanguage)) {
      setLanguage(cookieLanguage);
    }

        fetch("/api/stats")
          .then((res) => res.json())
          .then((data) => {
            if (data.count !== undefined) {
              setUploadCount(data.count);
            }
          })
          .catch(() => {
            setUploadCount(null);
          });

        fetch("/api/auth/session")
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              setUser(data.user);
              fetch("/api/user/images")
                .then((res) => res.json())
                .then((imagesData) => {
                  if (imagesData.images && imagesData.images.length > 0) {
                    const formattedImages = imagesData.images
                      .slice(0, 10)
                      .map((img: any) => ({
                        url: `/image/${img.fileName}`,
                        fileName: img.fileName,
                        timestamp: new Date(img.uploadedAt).getTime(),
                        hasPassword: img.hasPassword || false,
                      }));
                    setRecentUploads(formattedImages);
                  }
                })
                .catch(() => {});
            } else {
              if (typeof window !== "undefined") {
                const stored = localStorage.getItem("recentUploads");
                if (stored) {
                  try {
                    const parsed = JSON.parse(stored);
                    setRecentUploads(parsed.slice(0, 10));
                  } catch {
                    setRecentUploads([]);
                  }
                }
              }
            }
          })
          .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      document.cookie = "theme=dark; path=/; max-age=31536000";
    } else {
      root.classList.remove("dark");
      document.cookie = "theme=light; path=/; max-age=31536000";
    }
  }, [darkMode, mounted]);

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles);
    
    if (files.length + filesArray.length > 10) {
      toast({
        variant: "destructive",
        description: t.maxImagesAllowed,
      });
      return;
    }
    
    const validFiles: File[] = [];
    const newPreviews: { file: File; preview: string }[] = [];
    let processedCount = 0;

    filesArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          description: translations[language].pleaseSelectImage,
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          description: translations[language].fileSizeMustBeLess,
        });
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        processedCount++;
        newPreviews.push({ file, preview: reader.result as string });
        if (processedCount === validFiles.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          setImageMetadata((prev) => ({
            ...prev,
            [file.name]: {
              width: img.width,
              height: img.height,
              size: file.size,
              format: file.type,
            },
          }));
        };
        img.src = reader.result as string;
      };
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setUploadedUrls([]);
      setProgress(0);
    }
  }, [toast, language, t.maxImagesAllowed, files.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
  };

  const uploadSingleFileWrapper = useCallback(
    async (file: File, index: number, total: number) => {
      return uploadSingleFile(file, index, total, {
        customFileName: files.length === 1 ? customFileName : undefined,
        retentionTime,
        retentionMode,
        customRetentionHours,
        imagePassword: imagePassword && imagePassword === confirmImagePassword ? imagePassword : undefined,
        confirmImagePassword: imagePassword && imagePassword === confirmImagePassword ? confirmImagePassword : undefined,
        language,
        onProgress: (progress) => {
          if (total === 1) {
            setProgress(progress);
          }
        },
        onFileProgress: (fileIndex, fileTotal, overallProgress) => {
          setProgress(overallProgress);
        },
      });
    },
    [customFileName, retentionTime, retentionMode, customRetentionHours, imagePassword, confirmImagePassword, files.length, language]
  );

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setUploadQueue([...files]);

    try {
      const results: Array<{ url: string; fileName: string; hasPassword?: boolean }> = [];

      for (let i = 0; i < files.length; i++) {
        const result = await uploadSingleFileWrapper(files[i], i + 1, files.length);
        if (result) {
          results.push({
            url: result.url,
            fileName: result.fileName,
            hasPassword: result.hasPassword || false,
          });
        }
      }

      setUploadedUrls(results);

      if (user) {
        fetch("/api/user/images")
          .then((res) => res.json())
          .then((imagesData) => {
            if (imagesData.images && imagesData.images.length > 0) {
              const formattedImages = imagesData.images
                .slice(0, 10)
                .map((img: any) => ({
                  url: `/image/${img.fileName}`,
                  fileName: img.fileName,
                  timestamp: new Date(img.uploadedAt).getTime(),
                  hasPassword: img.hasPassword || false,
                }));
              setRecentUploads(formattedImages);
            }
          })
          .catch(() => {});
      } else {
        if (typeof window !== "undefined") {
          const newUploads = results.map((r) => ({
            ...r,
            timestamp: Date.now(),
          }));
          const updated = [...newUploads, ...recentUploads].slice(0, 10);
          localStorage.setItem("recentUploads", JSON.stringify(updated));
          setRecentUploads(updated);
        }
      }

      toast({
        variant: "success",
        description: `${files.length} ${t.uploadSuccessful}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Something went wrong.",
      });
    } finally {
      setUploading(false);
      setUploadQueue([]);
      setCurrentUploadIndex(0);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setPreviews([]);
    setUploadedUrls([]);
    setUploadQueue([]);
    setProgress(0);
    setCustomFileName("");
    setRetentionTime(0);
    setRetentionMode("preset");
    setCustomRetentionHours("");
    setImagePassword("");
    setConfirmImagePassword("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyUrl = useCallback(async (url: string) => {
    if (!url || typeof window === "undefined") return;
    
    const fullUrl = `${getBaseUrl()}${url}`;
    
    try {
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, fullUrl.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast({
          description: t.copied,
        });
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(fullUrl);
            toast({
              description: t.copied,
            });
          } catch (clipboardError) {
            toast({
              variant: "destructive",
              description: t.failedToCopyUrl,
            });
          }
        } else {
          toast({
            variant: "destructive",
            description: t.failedToCopyUrl,
          });
        }
      }
    } catch (error) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(fullUrl);
          toast({
            description: t.copied,
          });
        } catch (clipboardError) {
          toast({
            variant: "destructive",
            description: t.failedToCopyUrl,
          });
        }
      } else {
        toast({
          variant: "destructive",
          description: t.failedToCopyUrl,
        });
      }
    }
  }, [toast, t]);

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to download image",
      });
    }
  };

  const handleBulkDownload = async () => {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const uploadedUrl of uploadedUrls) {
        try {
          const response = await fetch(`${getBaseUrl()}${uploadedUrl.url}`);
          const blob = await response.blob();
          zip.file(uploadedUrl.fileName, blob);
        } catch (error) {
          console.error(`Failed to add ${uploadedUrl.fileName} to ZIP:`, error);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to create ZIP file",
      });
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ id: data.userId, email: data.email });
        setShowLoginDialog(false);
        setLoginEmail("");
        setLoginPassword("");
        toast({
          description: t.login + " başarılı",
        });
      } else {
        toast({
          variant: "destructive",
          description: data.error || "Login failed",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Login failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (registerPassword !== registerConfirmPassword) {
      toast({
        variant: "destructive",
        description: t.passwordsDoNotMatch,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          description: t.signUp + " başarılı, giriş yapılıyor...",
        });
        setShowRegisterDialog(false);
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        const loginResponse = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registerEmail, password: registerPassword }),
        });
        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
          setUser({ id: loginData.userId, email: loginData.email });
        }
      } else {
        toast({
          variant: "destructive",
          description: data.error || "Kayıt başarısız",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Bir hata oluştu",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setUser(null);
      toast({
        description: t.signOut + " başarılı",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Çıkış yapılırken bir hata oluştu",
      });
    }
  };

  const stars = useMemo(() => {
    const starElements = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 3;
      const size = Math.random() * 2 + 1;
      starElements.push(
        <div
          key={i}
          className="star"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${delay}s`,
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      );
    }
    return starElements;
  }, []);

  if (!mounted) {
    return null;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "upload.earth",
    "url": getBaseUrl(),
    "description": "Professional image hosting service. Upload your images instantly, get shareable links in seconds.",
    "applicationCategory": "ImageHostingApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1000"
    },
    "featureList": [
      "Free image hosting",
      "No registration required",
      "No quality loss",
      "Unlimited bandwidth",
      "API access",
      "Fast upload speed",
      "Secure storage",
      "Shareable links"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] flex flex-col items-center justify-center p-4 pb-32 md:pb-32 relative overflow-y-auto overflow-x-hidden"
        >
        {darkMode && (
          <div className="stars fixed inset-0">
            {stars}
          </div>
        )}
        <Navbar
          user={user}
          darkMode={darkMode}
          language={language}
          showRecentUploads={showRecentUploads}
          currentPage="home"
          onDarkModeToggle={() => setDarkMode(!darkMode)}
          onLoginClick={() => setShowLoginDialog(true)}
          onRecentUploadsToggle={() => setShowRecentUploads(!showRecentUploads)}
          onHomeClick={() => window.location.href = "/"}
          onPricingClick={() => window.location.href = "/pricing"}
        />
        <RecentUploadsPanel
          show={showRecentUploads}
          loading={loadingRecentUploads}
          uploads={recentUploads}
          user={user}
          language={language}
          onClear={() => {
            setRecentUploads([]);
            if (user) {
              fetch("/api/user/images")
                .then((res) => res.json())
                .then((data) => {
                  if (data.images) {
                    setRecentUploads([]);
                  }
                })
                .catch(() => {});
            } else {
              if (typeof window !== "undefined") {
                localStorage.removeItem("recentUploads");
              }
            }
          }}
          formatDate={(timestamp) => formatDate(timestamp, language)}
        />
        <div className="w-full max-w-2xl relative overflow-x-hidden pt-24 flex-1 flex flex-col">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-3">
              {t.title}
            </h1>
            <p className="text-gray-500 dark:text-[#8B8C8D] font-light text-sm max-w-lg mx-auto">
              {t.description}
            </p>
          </div>

          {uploadedUrls.length === 0 ? (
            <UploadCard
              darkMode={darkMode}
              language={language}
              isDragging={isDragging}
              files={files}
              previews={previews}
              uploading={uploading}
              progress={progress}
              currentUploadIndex={currentUploadIndex}
              customFileName={customFileName}
              retentionTime={retentionTime}
              retentionMode={retentionMode}
              customRetentionHours={customRetentionHours}
              imagePassword={imagePassword}
              confirmImagePassword={confirmImagePassword}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileInputChange={handleFileInputChange}
              onRemoveFile={removeFile}
              onCustomFileNameChange={setCustomFileName}
              onRetentionModeChange={(value) => {
                setRetentionMode(value);
                if (value === "preset") {
                  setCustomRetentionHours("");
                } else {
                  setRetentionTime(0);
                }
              }}
              onRetentionTimeChange={setRetentionTime}
              onCustomRetentionHoursChange={setCustomRetentionHours}
              onImagePasswordChange={setImagePassword}
              onConfirmImagePasswordChange={setConfirmImagePassword}
              onUpload={handleUpload}
              onClear={handleClear}
            />
          ) : (
            <UploadResults
              uploadedUrls={uploadedUrls}
              files={files}
              imageMetadata={imageMetadata}
              showQrCode={showQrCode}
              showImageInfo={showImageInfo}
              showShareMenu={showShareMenu}
              shareMenuPosition={shareMenuPosition}
              language={language}
              shareButtonRefs={shareButtonRefs}
              onCopyUrl={handleCopyUrl}
              onDownload={handleDownload}
              onBulkDownload={handleBulkDownload}
              onClear={handleClear}
              onToggleQrCode={(index) => setShowQrCode((prev) => ({ ...prev, [index]: !prev[index] }))}
              onToggleImageInfo={(index) => setShowImageInfo((prev) => ({ ...prev, [index]: !prev[index] }))}
              onToggleShareMenu={(index) => setShowShareMenu((prev) => ({ ...prev, [index]: !prev[index] }))}
              onSetShareMenuPosition={(index, position) => setShareMenuPosition((prev) => ({ ...prev, [index]: position }))}
            />
          )}

          {uploading && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-[#8B8C8D] font-light">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.uploadingToS3}</span>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <UploadCount count={uploadCount} language={language} />

          <LanguageSelector
            language={language}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              document.cookie = `language=${lang}; path=/; max-age=31536000`;
            }}
          />
        </div>

        <footer className="md:hidden relative mt-auto pt-8 pb-6 px-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2 text-xs font-light">
              <div className="flex gap-1 items-center text-gray-500 dark:text-gray-100">
                <button
                  onClick={() => {
                    setLanguage("en");
                    document.cookie = "language=en; path=/; max-age=31536000";
                  }}
                  className={`transition-all duration-200 hover:underline hover:text-gray-500 dark:hover:text-gray-200 ${language === "en" ? "text-gray-500 dark:text-gray-100 underline" : ""
                    }`}
                >
                  English
                </button>
                <span>,</span>
                <button
                  onClick={() => {
                    setLanguage("fr");
                    document.cookie = "language=fr; path=/; max-age=31536000";
                  }}
                  className={`transition-all duration-200 hover:underline hover:text-gray-500 dark:hover:text-gray-200 ${language === "fr" ? "text-gray-500 dark:text-gray-200 underline" : ""
                    }`}
                >
                  Français
                </button>
                <span>,</span>
                <button
                  onClick={() => {
                    setLanguage("tr");
                    document.cookie = "language=tr; path=/; max-age=31536000";
                  }}
                  className={`transition-all duration-200 hover:underline hover:text-gray-500 dark:hover:text-gray-200 ${language === "tr" ? "text-gray-500 dark:text-gray-200 underline" : ""
                    }`}
                >
                  Türkçe
                </button>
              </div>
              <div className="flex gap-2 items-center text-gray-500 dark:text-gray-400">
                <Link
                  href="/privacy"
                  className="transition-all duration-200 hover:underline hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link
                  href="/terms"
                  className="transition-all duration-200 hover:underline hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
            {uploadCount !== null && (
              <div className="text-right">
                <p className="text-xs font-light text-gray-500 dark:text-gray-400 mb-2">
                  {t.uploadedImages}
                </p>
                <p className="text-2xl font-light text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  {String(uploadCount).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1,$2')}
                </p>
              </div>
            )}
          </div>
        </footer>

        <AuthDialogs
          showLoginDialog={showLoginDialog}
          showRegisterDialog={showRegisterDialog}
          isLoading={isLoading}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          registerEmail={registerEmail}
          registerPassword={registerPassword}
          registerConfirmPassword={registerConfirmPassword}
          language={language}
          onLoginDialogChange={setShowLoginDialog}
          onRegisterDialogChange={setShowRegisterDialog}
          onLoginEmailChange={setLoginEmail}
          onLoginPasswordChange={setLoginPassword}
          onRegisterEmailChange={setRegisterEmail}
          onRegisterPasswordChange={setRegisterPassword}
          onRegisterConfirmPasswordChange={setRegisterConfirmPassword}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
        />

            <Toaster />
          </motion.div>
        </>
      );
    }
