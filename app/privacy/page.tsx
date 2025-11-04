"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { translations, type Language } from "@/lib/translations";
import { getBaseUrl } from "@/lib/utils/url";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    const themeCookie = document.cookie.split("; ").find((row) => row.startsWith("theme="));
    const savedTheme = themeCookie ? themeCookie.split("=")[1] : "light";
    setDarkMode(savedTheme === "dark");

    const langCookie = document.cookie.split("; ").find((row) => row.startsWith("language="));
    const savedLang = langCookie ? (langCookie.split("=")[1] as Language) : "en";
    setLanguage(savedLang);

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

  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - upload.earth",
    "url": `${getBaseUrl()}/privacy`,
    "description": "Privacy Policy for upload.earth image hosting service. Learn how we protect your data and privacy."
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
        currentPage="privacy"
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        onLoginClick={() => router.push("/")}
        onRecentUploadsToggle={() => {}}
        onHomeClick={() => router.push("/")}
        onPricingClick={() => router.push("/pricing")}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-white dark:bg-[#141414] text-gray-900 dark:text-white pt-24 pb-12 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-sm font-light leading-relaxed">
            <section>
              <h2 className="text-xl font-normal mb-4">1. Data Storage Location</h2>
              <p className="text-gray-700 dark:text-gray-300">
                All data is stored in Germany. Our services comply with German data protection laws, 
                including the General Data Protection Regulation (GDPR - DSGVO).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">2. Data Collection</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                We collect the following information when you upload images:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                <li>IP address</li>
                <li>User agent (browser information)</li>
                <li>Referer information</li>
                <li>Upload method (site or API)</li>
                <li>File size and metadata</li>
                <li>Account information (if registered)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">3. Data Deletion and Access Requests</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Data deletion and access requests are only processed when received from:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Law enforcement agencies with proper legal authorization</li>
                <li>Government authorities with valid court orders</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                For all data deletion and access requests, please contact us at:{" "}
                <a href="mailto:p@evoise.dev" className="underline hover:text-gray-900 dark:hover:text-gray-100">
                  p@evoise.dev
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">4. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Images and associated data are retained according to your specified retention period. 
                Permanent uploads are stored indefinitely unless deleted by authorized law enforcement requests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">5. Legal Basis</h2>
              <p className="text-gray-700 dark:text-gray-300">
                This service operates under German law (Bundesdatenschutzgesetz - BDSG) and the 
                European General Data Protection Regulation (GDPR). All data processing is conducted 
                in compliance with these regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">6. Contact</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For privacy-related inquiries, please contact:{" "}
                <a href="mailto:p@evoise.dev" className="underline hover:text-gray-900 dark:hover:text-gray-100">
                  p@evoise.dev
                </a>
              </p>
            </section>

            <section>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </>
  );
}

