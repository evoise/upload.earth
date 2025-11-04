"use client";

import Link from "next/link";
import { type Language } from "@/lib/translations";

interface LanguageSelectorProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSelector({ language, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="fixed bottom-6 left-6 flex flex-col gap-2 z-50 text-xs font-light">
      <div className="flex gap-1 items-center text-gray-500 dark:text-gray-100">
        <button
          onClick={() => {
            onLanguageChange("en");
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
            onLanguageChange("fr");
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
            onLanguageChange("tr");
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
  );
}

