"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { translations, type Language } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import LanguageSelector from "@/components/LanguageSelector";
import { getBaseUrl } from "@/lib/utils/url";

export default function PricingPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
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

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
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

  useEffect(() => {
    if (!mounted) return;

    document.cookie = `language=${language}; path=/; max-age=31536000`;
  }, [language, mounted]);

  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Pricing Plans - upload.earth",
    "url": `${getBaseUrl()}/pricing`,
    "description": "Choose the perfect plan for your image hosting needs. Free, Starter, and Pro plans available.",
    "mainEntity": {
      "@type": "OfferCatalog",
      "name": "Image Hosting Plans",
      "itemListElement": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "description": "Perfect for personal use and testing"
        },
        {
          "@type": "Offer",
          "name": "Starter Plan",
          "price": "9.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "description": "Ideal for small projects and businesses"
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "29.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "description": "For power users and large-scale applications"
        }
      ]
    }
  }), []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar
        user={user}
        darkMode={darkMode}
        language={language}
        showRecentUploads={false}
        currentPage="pricing"
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        onLoginClick={() => router.push("/")}
        onRecentUploadsToggle={() => {}}
        onHomeClick={() => router.push("/")}
        onPricingClick={() => {}}
      />
      <LanguageSelector
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          document.cookie = `language=${lang}; path=/; max-age=31536000`;
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#141414] dark:via-[#141414] dark:to-[#141414] p-4 pb-32"
      >
        <div className="max-w-6xl mx-auto pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4">{t.pricing}</h1>
            <p className="text-sm font-light text-gray-600 dark:text-gray-400">
              Choose the perfect plan for your API needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-[#8B8C8D]/20 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-1">{t.free}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-gray-900 dark:text-white">$0</span>
                  <span className="text-sm font-light text-gray-500 dark:text-[#8B8C8D]">/{t.monthly}</span>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-[#8B8C8D]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.uploadsPerMonth}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.apiRequests}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">1,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.storage}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">1 GB</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-2">{t.features}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.emailSupport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.bulkUpload}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.passwordProtection.replace(" (optional)", "")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✗</span>
                    <span className="text-xs font-light text-gray-400 dark:text-[#8B8C8D]">{t.prioritySupport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✗</span>
                    <span className="text-xs font-light text-gray-400 dark:text-[#8B8C8D]">{t.analytics}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✗</span>
                    <span className="text-xs font-light text-gray-400 dark:text-[#8B8C8D]">{t.customDomain}</span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (!user) {
                    router.push("/");
                  } else {
                    toast({
                      description: "You're already on the Free plan",
                    });
                  }
                }}
                className="w-full rounded-lg"
                variant="outline"
              >
                {t.choosePlan}
              </Button>
            </div>
            <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-[#8B8C8D]/20 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-1">{t.starter}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-gray-900 dark:text-white">$9</span>
                  <span className="text-sm font-light text-gray-500 dark:text-[#8B8C8D]">/{t.monthly}</span>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-[#8B8C8D]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.uploadsPerMonth}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">1,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.apiRequests}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">10,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.storage}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">100 GB</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-2">{t.features}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.emailSupport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.bulkUpload}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.passwordProtection.replace(" (optional)", "")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.retentionControl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.analytics}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✗</span>
                    <span className="text-xs font-light text-gray-400 dark:text-[#8B8C8D]">{t.prioritySupport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✗</span>
                    <span className="text-xs font-light text-gray-400 dark:text-[#8B8C8D]">{t.customDomain}</span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:p@evoise.dev?subject=Starter Plan Purchase&body=Hello, I would like to purchase the Starter plan.`;
                }}
                className="w-full rounded-lg"
                variant="outline"
              >
                {t.buyNow}
              </Button>
            </div>
            <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-[#8B8C8D]/20 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-1">{t.pro}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-gray-900 dark:text-white">$29</span>
                  <span className="text-sm font-light text-gray-500 dark:text-[#8B8C8D]">/{t.monthly}</span>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-[#8B8C8D]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.uploadsPerMonth}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">10,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.apiRequests}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">100,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.storage}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">300 GB</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-2">{t.features}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.prioritySupport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.bulkUpload}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.passwordProtection.replace(" (optional)", "")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.retentionControl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.analytics}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.advancedApi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✗</span>
                    <span className="text-xs font-light text-gray-400 dark:text-[#8B8C8D]">{t.customDomain}</span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:p@evoise.dev?subject=Pro Plan Purchase&body=Hello, I would like to purchase the Pro plan.`;
                }}
                className="w-full rounded-lg"
                variant="outline"
              >
                {t.buyNow}
              </Button>
            </div>
            <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-[#8B8C8D]/20 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-1">{t.enterprise}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-gray-900 dark:text-white">Custom</span>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-[#8B8C8D]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.uploadsPerMonth}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">{t.unlimited}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.apiRequests}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">{t.unlimited}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.storage}</span>
                  <span className="text-sm font-light text-gray-900 dark:text-white">{t.unlimited}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mb-2">{t.features}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.prioritySupport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.bulkUpload}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.passwordProtection.replace(" (optional)", "")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.retentionControl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.analytics}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.advancedApi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#8B8C8D]">✓</span>
                    <span className="text-xs font-light text-gray-600 dark:text-gray-400">{t.customDomain}</span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:p@evoise.dev?subject=Enterprise Plan Inquiry&body=Hello, I would like to inquire about the Enterprise plan.`;
                }}
                className="w-full rounded-lg"
                variant="outline"
              >
                {t.contactUs}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      <Toaster />
    </>
  );
}

