"use client";

import { translations, type Language } from "@/lib/translations";

interface UploadCountProps {
  count: number | null;
  language: Language;
}

export default function UploadCount({ count, language }: UploadCountProps) {
  const t = translations[language];

  if (count === null) return null;

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center w-full">
      <p className="text-xs font-light text-gray-500 dark:text-gray-400 mb-2">
        {t.uploadedImages}
      </p>
      <p className="text-2xl font-light text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
        {String(count).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1,$2')}
      </p>
    </div>
  );
}

