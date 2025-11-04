"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { translations, type Language } from "@/lib/translations";
import { getBaseUrl } from "@/lib/utils/url";

export default function TermsOfServicePage() {
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
    "name": "Terms of Service - upload.earth",
    "url": `${getBaseUrl()}/terms`,
    "description": "Terms of Service for upload.earth image hosting service. Read our terms and conditions."
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
        currentPage="terms"
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
          <h1 className="text-3xl font-light mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-sm font-light leading-relaxed">
            <section>
              <h2 className="text-xl font-normal mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                By using this service, you agree to comply with and be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">2. Service Description</h2>
              <p className="text-gray-700 dark:text-gray-300">
                This service provides image hosting and storage capabilities. Users can upload images 
                and receive shareable links. All data is stored in Germany and subject to German law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">3. Prohibited Content</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                You may not upload content that:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Violates any applicable laws or regulations</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains illegal, harmful, or offensive material</li>
                <li>Violates privacy rights of others</li>
                <li>Contains malware, viruses, or malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">4. Data Storage and Location</h2>
              <p className="text-gray-700 dark:text-gray-300">
                All data is stored in Germany in compliance with German data protection laws (BDSG) 
                and the European General Data Protection Regulation (GDPR). By using this service, 
                you acknowledge that your data will be stored in Germany.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">5. Data Deletion and Law Enforcement</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Data deletion and access requests are only processed when received from authorized 
                law enforcement agencies or government authorities with proper legal authorization. 
                For such requests, please contact:{" "}
                <a href="mailto:p@evoise.dev" className="underline hover:text-gray-900 dark:hover:text-gray-100">
                  p@evoise.dev
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">6. Service Availability</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify, suspend, or discontinue the service at any time 
                without prior notice. We do not guarantee uninterrupted or error-free service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>NO WARRANTIES:</strong> This service is provided &quot;as is&quot; and &quot;as available&quot; without any 
                warranties, express or implied, including but not limited to warranties of merchantability, 
                fitness for a particular purpose, or non-infringement. We explicitly disclaim all warranties 
                of any kind.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>NO LIABILITY:</strong> Under no circumstances shall we be liable for any direct, indirect, 
                incidental, special, consequential, or punitive damages, including but not limited to loss of 
                profits, data, or use, arising out of or in connection with the use or inability to use this service.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>COMPLETE DISCLAIMER:</strong> We accept no responsibility or liability for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300 mb-4">
                <li>Any loss or damage to uploaded images or data</li>
                <li>Service interruptions, errors, or failures</li>
                <li>Unauthorized access to or use of your data</li>
                <li>Any third-party actions or content</li>
                <li>Any consequences resulting from the use of this service</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                By using this service, you acknowledge and agree that you use it at your own risk and that 
                we shall not be liable for any damages whatsoever.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">8. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms of Service are governed by German law. Any disputes arising from these 
                terms shall be subject to the exclusive jurisdiction of German courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-normal mb-4">9. Contact</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions regarding these terms, please contact:{" "}
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

