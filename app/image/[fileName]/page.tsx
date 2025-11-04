"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, Moon, Sun, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { translations, type Language } from "@/lib/translations";
import { getBaseUrl, getImageUrl } from "@/lib/utils/url";

export default function ImagePage() {
  const params = useParams();
  const router = useRouter();
  const fileName = params.fileName as string;
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const { toast } = useToast();

  const t = translations[language];

  const checkImage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!fileName) {
        setError("File name is required");
        setLoading(false);
        return;
      }
      
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`/api/image/${encodedFileName}`);
      
      if (response.status === 401) {
        setRequiresPassword(true);
        setHasPassword(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Image not found";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Image is empty");
      }
      
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setRequiresPassword(false);
      setHasPassword(false);
    } catch (err: any) {
      setError(err.message || "Failed to load image");
    } finally {
      setLoading(false);
    }
  }, [fileName]);

  useEffect(() => {
    const cookieTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1];

    const initialTheme = cookieTheme === "dark" || (!cookieTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (initialTheme) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    
    setMounted(true);

    const cookieLanguage = document.cookie
      .split("; ")
      .find((row) => row.startsWith("language="))
      ?.split("=")[1] as "en" | "fr" | "tr" | undefined;

    if (cookieLanguage && ["en", "fr", "tr"].includes(cookieLanguage)) {
      setLanguage(cookieLanguage);
    }
  }, []);

  useEffect(() => {
    if (fileName) {
      checkImage();
    }
  }, [fileName, checkImage]);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (!fileName) {
        setError("File name is required");
        setLoading(false);
        return;
      }
      
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`/api/image/${encodedFileName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.status === 401) {
        setError(t.wrongPassword);
        setPassword("");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to verify password");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setRequiresPassword(false);
      setHasPassword(true);
    } catch (err: any) {
      setError(err.message || "Failed to verify password");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = useCallback(async () => {
    if (!fileName || typeof window === "undefined") return;
    
    const fullUrl = getImageUrl(fileName);
    
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
  }, [fileName, t, toast]);

  const structuredData = useMemo(() => {
    if (!imageUrl || !fileName) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "contentUrl": imageUrl,
      "url": `${getBaseUrl()}/image/${fileName}`,
      "name": fileName,
      "description": `Image hosted on upload.earth: ${fileName}`
    };
  }, [imageUrl, fileName]);

  if (!mounted) {
    return null;
  }

  if (loading && !requiresPassword) {
    return (
      <>
        <button
          onClick={() => router.push("/")}
          className="fixed top-4 left-4 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center px-4 transition-all duration-200 z-50 cursor-pointer text-xs font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 whitespace-nowrap"
        >
          {t.goToHome}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-white" />
          ) : (
            <Moon className="w-5 h-5 text-gray-900" />
          )}
        </button>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-600" />
            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
              Loading image...
            </p>
          </div>
        </motion.div>
      </>
    );
  }

  if (error && !requiresPassword) {
    return (
      <>
        <button
          onClick={() => router.push("/")}
          className="fixed top-4 left-4 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center px-4 transition-all duration-200 z-50 cursor-pointer text-xs font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 whitespace-nowrap"
        >
          {t.goToHome}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-white" />
          ) : (
            <Moon className="w-5 h-5 text-gray-900" />
          )}
        </button>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] flex items-center justify-center p-4"
        >
          <div className="text-center">
            <p className="text-sm font-light text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="rounded-lg"
            >
              Go Home
            </Button>
          </div>
        </motion.div>
      </>
    );
  }

  if (requiresPassword) {
    return (
      <>
        <button
          onClick={() => router.push("/")}
          className="fixed top-4 left-4 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center px-4 transition-all duration-200 z-50 cursor-pointer text-xs font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 whitespace-nowrap"
        >
          {t.goToHome}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-white" />
          ) : (
            <Moon className="w-5 h-5 text-gray-900" />
          )}
        </button>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-0 p-8" style={{ backgroundColor: darkMode ? '#141414' : '#ffffff' }}>
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#8B8C8D]/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-400 dark:text-[#8B8C8D]" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-light text-gray-900 dark:text-white mb-2">
                  {t.passwordProtection}
                </h2>
                <p className="text-sm font-light text-gray-500 dark:text-[#8B8C8D]">
                  {t.enterImagePassword}
                </p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="w-full space-y-4" autoComplete="off">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.enterPassword}
                  className="w-full"
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  name="imagePassword"
                />
                {error && (
                  <p className="text-sm font-light text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    t.viewImage
                  )}
                </Button>
              </form>
            </div>
          </div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <button
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center px-4 transition-all duration-200 z-50 cursor-pointer text-xs font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 whitespace-nowrap"
      >
        {t.goToHome}
      </button>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-white" />
        ) : (
          <Moon className="w-5 h-5 text-gray-900" />
        )}
      </button>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-4xl space-y-4">
          {imageUrl && (
            <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-0 p-4" style={{ backgroundColor: darkMode ? '#141414' : '#ffffff' }}>
              <img
                src={imageUrl}
                alt="Image"
                className="w-full h-auto max-h-[80vh] object-contain mx-auto rounded-lg"
              />
            </div>
          )}
          {!hasPassword && (
            <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-0 p-4" style={{ backgroundColor: darkMode ? '#141414' : '#ffffff' }}>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={getImageUrl(fileName)}
                  readOnly
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.select();
                  }}
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyUrl();
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <Toaster />
    </>
  );
}

