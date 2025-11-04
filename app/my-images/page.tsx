"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, ExternalLink, Lock, QrCode, Info, Share2, Copy, Loader2, Moon, Sun, User, Upload, Key, Edit, Save, X } from "lucide-react";
import QRCodeSVG from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { translations, type Language } from "@/lib/translations";
import { getBaseUrl, getImageUrl, getApiUrl } from "@/lib/utils/url";

interface ImageData {
  fileName: string;
  url: string;
  uploadedAt: string;
  hasPassword: boolean;
  expiresAt: string | null;
}

export default function MyImagesPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; avatarUrl?: string | null; apiKey?: string | null; plan?: string; isAdmin?: boolean } | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allImages, setAllImages] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<string>("free");
  const [editIsAdmin, setEditIsAdmin] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showQrCode, setShowQrCode] = useState<{ [key: string]: boolean }>({});
  const [showImageInfo, setShowImageInfo] = useState<{ [key: string]: boolean }>({});
  const [showShareMenu, setShowShareMenu] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState("images");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("curl");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const t = translations[language];

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
      ?.split("=")[1] as Language | undefined;

    if (cookieLanguage && ["en", "fr", "tr"].includes(cookieLanguage)) {
      setLanguage(cookieLanguage);
    }

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          fetch("/api/user/images")
            .then((res) => res.json())
            .then((imageData) => {
              if (imageData.images) {
                setImages(imageData.images);
              }
            })
            .catch(() => {
              setImages([]);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          router.push("/");
        }
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

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

  const handleCopyUrl = async (url: string) => {
    const fullUrl = `${getBaseUrl()}${url}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        description: t.copied,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: t.failedToCopyUrl,
      });
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const fullUrl = getImageUrl(fileName);

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to download image",
      });
    }
  };

  const shareUrl = (url: string, platform: string) => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "en" ? "en-US" : language === "fr" ? "fr-FR" : "tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        description: "Please select an image file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        description: "File size must be less than 5MB",
      });
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.avatarUrl) {
        fetch("/api/auth/session")
          .then((res) => res.json())
          .then((sessionData) => {
            if (sessionData.user) {
              setUser(sessionData.user);
            }
          })
          .catch(() => {});
        toast({
          description: "Avatar uploaded successfully",
        });
      } else {
        toast({
          variant: "destructive",
          description: data.error || "Failed to upload avatar",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to upload avatar",
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const fetchApiKey = useCallback(async () => {
    setLoadingApiKey(true);
    try {
      const response = await fetch('/api/user/apikey');
      const data = await response.json();
      if (response.ok) {
        setApiKey(data.apiKey);
      } else {
        toast({
          variant: "destructive",
          description: data.error || "Failed to fetch API key",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to fetch API key",
      });
    } finally {
      setLoadingApiKey(false);
    }
  }, [toast]);

  const fetchAdminData = useCallback(async () => {
    setLoadingAdmin(true);
    try {
      const [usersRes, imagesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/images"),
      ]);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }
      
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setAllImages(imagesData.images || []);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to fetch admin data",
      });
    } finally {
      setLoadingAdmin(false);
    }
  }, [toast]);

  const generateApiKey = async () => {
    setLoadingApiKey(true);
    try {
      const response = await fetch('/api/user/apikey', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setApiKey(data.apiKey);
        fetch("/api/auth/session")
          .then((res) => res.json())
          .then((sessionData) => {
            if (sessionData.user) {
              setUser(sessionData.user);
            }
          })
          .catch(() => {});
        toast({
          description: "API key generated successfully",
        });
      } else {
        toast({
          variant: "destructive",
          description: data.error || "Failed to generate API key",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to generate API key",
      });
    } finally {
      setLoadingApiKey(false);
    }
  };

  useEffect(() => {
    if (activeTab === "apikey") {
      if (user?.apiKey) {
        setApiKey(user.apiKey);
      } else if (!apiKey) {
        fetchApiKey();
      }
    } else if (activeTab === "admin" && user?.isAdmin) {
      fetchAdminData();
    }
  }, [activeTab, user?.apiKey, user?.isAdmin, apiKey, fetchApiKey, fetchAdminData]);

  const handleEditUser = (u: any) => {
    setEditingUser(u.id);
    setEditPlan(u.plan || "free");
    setEditIsAdmin(u.isAdmin || false);
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          plan: editPlan,
          isAdmin: editIsAdmin,
        }),
      });

      if (response.ok) {
        toast({
          description: "User updated successfully",
        });
        setEditingUser(null);
        fetchAdminData();
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          description: data.error || "Failed to update user",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to update user",
      });
    }
  };

  const filteredImages = selectedUserId && selectedUserId !== "all"
    ? allImages.filter((img: any) => img.userId === selectedUserId)
    : allImages;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-[#8B8C8D]" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="my-images"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] p-4 pb-32"
        >
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
        <div className="max-w-6xl mx-auto pt-24">
          {user && (
            <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#8B8C8D]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400 dark:text-[#8B8C8D]" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#8B8C8D]/20 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 transition-colors"
                    title={user.avatarUrl ? t.changeAvatar : t.uploadAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400 dark:text-[#8B8C8D]" />
                    ) : (
                      <Upload className="w-3 h-3 text-gray-400 dark:text-[#8B8C8D]" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-light text-gray-900 dark:text-white mb-1">
                    {user.email.split("@")[0]}
                  </h2>
                  <p className="text-sm font-light text-gray-500 dark:text-[#8B8C8D] mb-2">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-light text-gray-500 dark:text-[#8B8C8D]">
                      {t.currentPlan}:
                    </span>
                    <span className="text-xs font-light text-gray-900 dark:text-white px-2 py-1 rounded-full bg-gray-100 dark:bg-[#8B8C8D]/20 border border-gray-200 dark:border-[#8B8C8D]/20">
                      {user.plan === "free" ? t.free : user.plan === "starter" ? t.starter : user.plan === "pro" ? t.pro : user.plan === "enterprise" ? t.enterprise : t.free}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-0 border-b border-gray-200 dark:border-[#8B8C8D]/20 mb-6 rounded-none p-0 h-auto">
              <TabsTrigger value="images" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2">
                {t.yourImages}
              </TabsTrigger>
              <TabsTrigger value="apikey" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2">
                {t.apiKey}
              </TabsTrigger>
              {user?.isAdmin && (
                <TabsTrigger value="admin" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2">
                  {t.adminPanel}
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="images" className="mt-0">

          {images.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-[#8B8C8D] font-light mb-4">
                {t.noImagesYet}
              </p>
              <Button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg"
              >
                {t.uploadYourFirstImage}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.fileName}
                  className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-3 space-y-2"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#8B8C8D]/20">
                    {image.hasPassword ? (
                      <div className="flex flex-col items-center justify-center h-full p-8">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#8B8C8D]/20 flex items-center justify-center mb-4">
                          <Lock className="w-6 h-6 text-gray-400 dark:text-[#8B8C8D]" />
                        </div>
                        <p className="text-sm font-light text-gray-500 dark:text-[#8B8C8D]">
                          {t.passwordProtection}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={`/api/image/${image.fileName}`}
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={`${getBaseUrl()}${image.url}`}
                      readOnly
                      className="flex-1 min-w-0 text-xs"
                      onClick={(e) => {
                        e.currentTarget.select();
                      }}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        onClick={() => handleCopyUrl(image.url)}
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {!image.hasPassword && (
                        <>
                          <div className="relative">
                            <Button
                              type="button"
                              onClick={() => {
                                setShowShareMenu((prev) => ({ ...prev, [image.fileName]: !prev[image.fileName] }));
                              }}
                              variant="outline"
                              size="sm"
                              className="rounded-lg flex-shrink-0"
                              title={t.share}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            {showShareMenu[image.fileName] && (
                              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#141414] rounded-lg shadow-lg border border-gray-100 dark:border-[#8B8C8D]/20 p-1 z-10 min-w-[120px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    shareUrl(image.url, "twitter");
                                    setShowShareMenu((prev) => ({ ...prev, [image.fileName]: false }));
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                                >
                                  Twitter
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    shareUrl(image.url, "facebook");
                                    setShowShareMenu((prev) => ({ ...prev, [image.fileName]: false }));
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                                >
                                  Facebook
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    shareUrl(image.url, "whatsapp");
                                    setShowShareMenu((prev) => ({ ...prev, [image.fileName]: false }));
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    shareUrl(image.url, "telegram");
                                    setShowShareMenu((prev) => ({ ...prev, [image.fileName]: false }));
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                                >
                                  Telegram
                                </button>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setShowQrCode((prev) => ({ ...prev, [image.fileName]: !prev[image.fileName] }));
                            }}
                            variant="outline"
                            size="sm"
                            className="rounded-lg flex-shrink-0"
                            title={t.showQrCode}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              const fullUrl = typeof window !== "undefined"
                                ? `${getBaseUrl()}${image.url}`
                                : image.url;
                              window.open(fullUrl, "_blank");
                            }}
                            variant="outline"
                            size="sm"
                            className="rounded-lg flex-shrink-0"
                            title={t.openInNewTab}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleDownload(image.fileName)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg flex-shrink-0"
                            title={t.download}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    {showQrCode[image.fileName] && (
                      <div className="bg-white dark:bg-[#141414] rounded-lg p-4 border border-gray-100 dark:border-[#8B8C8D]/20 flex flex-col items-center gap-2">
                        <p className="text-xs font-light text-gray-600 dark:text-gray-400">{t.qrCode}</p>
                        <QRCodeSVG
                          value={`${getBaseUrl()}${image.url}`}
                          size={128}
                        />
                      </div>
                    )}
                    <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D]">
                      {formatDate(image.uploadedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
            </TabsContent>
            <TabsContent value="apikey" className="mt-0">
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Key className="w-5 h-5 text-gray-400 dark:text-[#8B8C8D]" />
                      <h3 className="text-lg font-light text-gray-900 dark:text-white">
                        {t.apiKey}
                      </h3>
                    </div>
                    <p className="text-sm font-light text-gray-500 dark:text-[#8B8C8D] mb-4">
                      Use your API key to upload images programmatically. Keep it secure and never share it publicly.
                    </p>
                    {apiKey ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={apiKey}
                            readOnly
                            className="flex-1 font-mono text-xs"
                            onClick={(e) => {
                              e.currentTarget.select();
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(apiKey);
                              toast({
                                description: t.copied,
                              });
                            }}
                            variant="outline"
                            size="sm"
                            className="rounded-lg flex-shrink-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={generateApiKey}
                        disabled={loadingApiKey}
                        className="rounded-lg"
                      >
                        {loadingApiKey ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                            {t.generateApiKey}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-6">
                  <h4 className="text-base font-light text-gray-900 dark:text-white mb-4">
                    API Usage Example
                  </h4>
                  <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage} className="w-full">
                    <TabsList className="w-full justify-start bg-transparent border-0 border-b border-gray-200 dark:border-[#8B8C8D]/20 mb-4 rounded-none p-0 h-auto">
                      <TabsTrigger value="curl" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        cURL
                      </TabsTrigger>
                      <TabsTrigger value="javascript" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        JavaScript
                      </TabsTrigger>
                      <TabsTrigger value="python" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        Python
                      </TabsTrigger>
                      <TabsTrigger value="php" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        PHP
                      </TabsTrigger>
                      <TabsTrigger value="go" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        Go
                      </TabsTrigger>
                      <TabsTrigger value="ruby" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        Ruby
                      </TabsTrigger>
                      <TabsTrigger value="java" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        Java
                      </TabsTrigger>
                      <TabsTrigger value="csharp" className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent mb-[-2px] pb-2 text-xs">
                        C#
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`curl -X POST \\
  ${getApiUrl("/api/upload")} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/image.jpg"`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('${getApiUrl("/api/upload")}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
})
.then(response => response.json())
.then(data => {});`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="python" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`import requests

url = '${getApiUrl("/api/upload")}'
headers = {'Authorization': 'Bearer YOUR_API_KEY'}
files = {'file': open('image.jpg', 'rb')}

response = requests.post(url, headers=headers, files=files)
print(response.json())`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="php" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${getApiUrl("/api/upload")}');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => new CURLFile('image.jpg')
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="go" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`package main

import (
    "bytes"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
)

func main() {
    file, _ := os.Open("image.jpg")
    defer file.Close()
    
    var b bytes.Buffer
    w := multipart.NewWriter(&b)
    fw, _ := w.CreateFormFile("file", "image.jpg")
    io.Copy(fw, file)
    w.Close()
    
    req, _ := http.NewRequest("POST", "${getApiUrl("/api/upload")}", &b)
    req.Header.Set("Content-Type", w.FormDataContentType())
    req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="ruby" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`require 'net/http'
require 'uri'

uri = URI('${getApiUrl("/api/upload")}')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true if uri.scheme == 'https'

request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request.set_form_data({'file' => File.open('image.jpg')})

response = http.request(request)
puts response.body`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="java" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class Upload {
    public static void main(String[] args) throws Exception {
        URL url = new URL("${getApiUrl("/api/upload")}");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer YOUR_API_KEY");
        conn.setDoOutput(true);
        
        File file = new File("image.jpg");
        FileInputStream fileInputStream = new FileInputStream(file);
        
        OutputStream outputStream = conn.getOutputStream();
        byte[] buffer = new byte[4096];
        int bytesRead;
        while ((bytesRead = fileInputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, bytesRead);
        }
        fileInputStream.close();
        outputStream.close();
        
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(conn.getInputStream())
        );
        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println(line);
        }
        reader.close();
    }
}`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="csharp" className="mt-0">
                      <div className="bg-gray-50 dark:bg-[#8B8C8D]/10 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
{`using System;
using System.Net.Http;
using System.IO;

class Program
{
    static async System.Threading.Tasks.Task Main()
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");
        
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(
            File.ReadAllBytes("image.jpg")
        );
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        content.Add(fileContent, "file", "image.jpg");
        
        var response = await client.PostAsync(
            "${getApiUrl("/api/upload")}",
            content
        );
        
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
}`}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-6">
                  <h4 className="text-base font-light text-gray-900 dark:text-white mb-4">
                    API Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-1">
                        Endpoint
                      </p>
                      <p className="text-sm font-light text-gray-900 dark:text-white">
                        POST /api/upload
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-1">
                        Authentication
                      </p>
                      <p className="text-sm font-light text-gray-900 dark:text-white">
                        Bearer Token
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-1">
                        Max File Size
                      </p>
                      <p className="text-sm font-light text-gray-900 dark:text-white">
                        10 MB
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-1">
                        Supported Formats
                      </p>
                      <p className="text-sm font-light text-gray-900 dark:text-white">
                        JPG, PNG, GIF, WEBP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            {user?.isAdmin && (
              <TabsContent value="admin" className="mt-0">
                {loadingAdmin ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-[#8B8C8D]" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-6">
                      <h3 className="text-lg font-light text-gray-900 dark:text-white mb-4">
                        {t.allUsers}
                      </h3>
                      <div className="space-y-3">
                        {allUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-[#8B8C8D]/20"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-light text-gray-900 dark:text-white mb-1">
                                {u.email}
                              </p>
                              <div className="flex items-center gap-4 text-xs font-light text-gray-500 dark:text-[#8B8C8D]">
                                <span>{t.userPlan}: {u.plan}</span>
                                <span>{t.userRole}: {u.isAdmin ? t.admin : t.user}</span>
                                <span>{t.imageCount}: {u.imageCount}</span>
                              </div>
                            </div>
                            {editingUser === u.id ? (
                              <div className="flex items-center gap-2">
                                <Select value={editPlan} onValueChange={setEditPlan}>
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">{t.free}</SelectItem>
                                    <SelectItem value="starter">{t.starter}</SelectItem>
                                    <SelectItem value="pro">{t.pro}</SelectItem>
                                    <SelectItem value="enterprise">{t.enterprise}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <label className="flex items-center gap-2 text-xs font-light text-gray-700 dark:text-gray-300">
                                  <input
                                    type="checkbox"
                                    checked={editIsAdmin}
                                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                                    className="rounded"
                                  />
                                  {t.admin}
                                </label>
                                <Button
                                  type="button"
                                  onClick={() => handleUpdateUser(u.id)}
                                  size="sm"
                                  className="rounded-lg"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => setEditingUser(null)}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => handleEditUser(u)}
                                size="sm"
                                variant="outline"
                                className="rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-light text-gray-900 dark:text-white">
                          {t.allImages}
                        </h3>
                        <Select value={selectedUserId || "all"} onValueChange={setSelectedUserId}>
                          <SelectTrigger className="w-48 h-8 text-xs">
                            <SelectValue placeholder={t.filterByUser} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t.allUsersOption}</SelectItem>
                            {allUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredImages.map((image) => (
                          <div
                            key={image.id}
                            className="bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-[#8B8C8D]/20 p-3 space-y-2"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#8B8C8D]/20">
                              {image.hasPassword ? (
                                <div className="flex flex-col items-center justify-center h-full p-4">
                                  <Lock className="w-6 h-6 text-gray-400 dark:text-[#8B8C8D]" />
                                </div>
                              ) : (
                                <img
                                  src={image.url}
                                  alt={image.fileName}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] truncate">
                                {image.userEmail}
                              </p>
                              <p className="text-xs font-light text-gray-400 dark:text-[#8B8C8D] truncate">
                                {new Date(image.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </>
  );
}

