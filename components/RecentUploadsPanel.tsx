"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translations, type Language } from "@/lib/translations";

interface RecentUpload {
  url: string;
  fileName: string;
  timestamp: number;
  hasPassword?: boolean;
}

interface RecentUploadsPanelProps {
  show: boolean;
  loading: boolean;
  uploads: RecentUpload[];
  user: { id: string; email: string } | null;
  language: Language;
  onClear: () => void;
  formatDate: (timestamp: number) => string;
}

export default function RecentUploadsPanel({
  show,
  loading,
  uploads,
  user,
  language,
  onClear,
  formatDate,
}: RecentUploadsPanelProps) {
  const t = translations[language];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-20 left-4 w-80 max-h-[calc(100vh-6rem)] bg-white dark:bg-[#141414] rounded-2xl shadow-lg border border-gray-100 dark:border-[#8B8C8D]/20 p-4 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-light text-gray-900 dark:text-white">{t.recentUploads}</h3>
            <Button
              type="button"
              onClick={onClear}
              variant="outline"
              size="sm"
              className="rounded-lg h-7 px-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-[#8B8C8D]" />
            </div>
          ) : uploads.length === 0 ? (
            <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] text-center py-8">
              {t.noRecentUploads}
            </p>
          ) : (
            <div className="space-y-2">
              {uploads.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-[#141414] rounded-lg p-3 border border-gray-100 dark:border-[#8B8C8D]/20 hover:border-gray-200 dark:hover:border-[#8B8C8D]/40 transition-colors cursor-pointer"
                  onClick={() => {
                    const fullUrl = typeof window !== "undefined"
                      ? `${window.location.origin}${item.url}`
                      : item.url;
                    window.open(fullUrl, "_blank");
                  }}
                >
                  <div className="flex items-start gap-2">
                    {item.hasPassword ? (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-[#8B8C8D]/20 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-gray-400 dark:text-[#8B8C8D]" />
                      </div>
                    ) : (
                      <img
                        src={`/api/image/${item.fileName}`}
                        alt={item.fileName}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-light text-gray-900 dark:text-white truncate">
                        {item.fileName}
                      </p>
                      <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D] mt-1">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

