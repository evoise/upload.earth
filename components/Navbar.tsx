"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, History, Github } from "lucide-react";
import { translations, type Language } from "@/lib/translations";

interface NavbarProps {
  user: { id: string; email: string } | null;
  darkMode: boolean;
  language: Language;
  showRecentUploads: boolean;
  currentPage?: "home" | "pricing" | "my-images" | "privacy" | "terms";
  onDarkModeToggle: () => void;
  onLoginClick: () => void;
  onRecentUploadsToggle: () => void;
  onHomeClick?: () => void;
  onPricingClick?: () => void;
}

export default function Navbar({
  user,
  darkMode,
  language,
  showRecentUploads,
  currentPage = "home",
  onDarkModeToggle,
  onLoginClick,
  onRecentUploadsToggle,
  onHomeClick,
  onPricingClick,
}: NavbarProps) {
  const t = translations[language];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      window.location.href = "/";
    }
  };

  const handlePricingClick = () => {
    if (onPricingClick) {
      onPricingClick();
    } else {
      window.location.href = "/pricing";
    }
  };

  const blurClass = scrolled ? "backdrop-blur-md bg-white/80 dark:bg-[#141414]/80" : "";

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 h-16 md:h-0 z-40 transition-all duration-300 ${blurClass}`} />
      {user ? (
        <button
          onClick={() => window.location.href = "/my-images"}
          className="fixed top-4 right-4 px-4 h-8 rounded-full bg-[#131313] dark:bg-white shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50 text-sm font-light text-white dark:text-gray-900"
          aria-label="Portal"
          title={t.myImages}
        >
          Portal
        </button>
      ) : (
        <button
          onClick={onLoginClick}
          className="fixed top-4 right-4 px-4 h-8 rounded-full bg-[#131313] dark:bg-white shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50 text-sm font-light text-white dark:text-gray-900"
          aria-label="Login"
        >
          {t.login}
        </button>
      )}
      <button
        onClick={onDarkModeToggle}
        className={`fixed top-4 ${user ? 'right-24' : 'right-24'} w-8 h-8 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-4 h-4 text-white" />
        ) : (
          <Moon className="w-4 h-4 text-gray-900" />
        )}
      </button>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-50">
        <button
          onClick={handleHomeClick}
          className="px-4 h-8 rounded-full hover:underline flex items-center justify-center transition-all duration-200 text-sm font-light text-gray-900 dark:text-white"
          aria-label="Home"
        >
          Home
        </button>
        <button
          onClick={handlePricingClick}
          className="px-4 h-8 rounded-full hover:underline flex items-center justify-center transition-all duration-200 text-sm font-light text-gray-900 dark:text-white"
          aria-label="Pricing"
        >
          {t.pricing}
        </button>
        <a
          href="https://github.com/evoise/upload.earth"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 h-8 rounded-full hover:underline flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-light text-gray-900 dark:text-white"
          aria-label="GitHub"
        >
          <Github className="w-4 h-4" />
          GitHub
        </a>
      </div>
      {currentPage === "home" && (
        <button
          onClick={onRecentUploadsToggle}
          className="fixed top-4 left-4 w-8 h-8 rounded-full bg-white dark:bg-[#141414] shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200 z-50"
          aria-label="Recent uploads"
        >
          <History className="w-4 h-4 text-gray-900 dark:text-white" />
        </button>
      )}
    </>
  );
}

