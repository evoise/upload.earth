"use client";

import { useRef, useEffect } from "react";
import { Check, Copy, Lock, Download, QrCode, Info, Share2, ExternalLink } from "lucide-react";
import QRCodeSVG from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations, type Language } from "@/lib/translations";
import { formatFileSize, shareUrl } from "@/lib/utils/file";
import { getBaseUrl } from "@/lib/utils/url";

interface UploadedUrl {
  url: string;
  fileName: string;
  hasPassword?: boolean;
}

interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface UploadResultsProps {
  uploadedUrls: UploadedUrl[];
  files: File[];
  imageMetadata: { [key: string]: ImageMetadata };
  showQrCode: { [key: number]: boolean };
  showImageInfo: { [key: number]: boolean };
  showShareMenu: { [key: number]: boolean };
  shareMenuPosition: { [key: number]: { top: number; left: number } };
  language: Language;
  shareButtonRefs: React.MutableRefObject<{ [key: number]: HTMLButtonElement | null }>;
  onCopyUrl: (url: string) => void;
  onDownload: (fileName: string, url: string) => void;
  onBulkDownload: () => void;
  onClear: () => void;
  onToggleQrCode: (index: number) => void;
  onToggleImageInfo: (index: number) => void;
  onToggleShareMenu: (index: number) => void;
  onSetShareMenuPosition: (index: number, position: { top: number; left: number }) => void;
}

export default function UploadResults({
  uploadedUrls,
  files,
  imageMetadata,
  showQrCode,
  showImageInfo,
  showShareMenu,
  shareMenuPosition,
  language,
  shareButtonRefs,
  onCopyUrl,
  onDownload,
  onBulkDownload,
  onClear,
  onToggleQrCode,
  onToggleImageInfo,
  onToggleShareMenu,
  onSetShareMenuPosition,
}: UploadResultsProps) {
  const t = translations[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(showShareMenu).forEach((indexStr) => {
        const index = Number(indexStr);
        if (showShareMenu[index]) {
          const menu = document.querySelector(`[data-share-menu="${index}"]`);
          const button = shareButtonRefs.current[index];
          if (menu && !menu.contains(event.target as Node) && button && !button.contains(event.target as Node)) {
            onToggleShareMenu(index);
          }
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showShareMenu, shareButtonRefs, onToggleShareMenu]);

  if (uploadedUrls.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-[#141414] border border-green-200 dark:border-green-500/30 rounded-lg p-4 overflow-visible">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900 dark:text-green-400">
              {uploadedUrls.length} {t.uploadSuccessful}
            </p>
          </div>
        </div>
        {uploadedUrls.length === 1 ? (
          <div className="space-y-3">
            {uploadedUrls.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#8B8C8D]/20 aspect-square max-w-md mx-auto">
                  {item.hasPassword ? (
                    <div className="flex flex-col items-center justify-center p-12 min-h-[200px]">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#8B8C8D]/20 flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-gray-400 dark:text-[#8B8C8D]" />
                      </div>
                      <p className="text-sm font-light text-gray-500 dark:text-[#8B8C8D]">
                        {t.passwordProtection}
                      </p>
                    </div>
                  ) : (
                    <img
                      src={`/api/image/${item.fileName}`}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="text"
                    value={`${getBaseUrl()}${item.url}`}
                    readOnly
                    className="flex-1 min-w-0 text-xs"
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
                      e.nativeEvent.stopImmediatePropagation();
                      onCopyUrl(item.url);
                      return false;
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-lg flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!item.hasPassword && (
                    <>
                      <div className="relative share-menu-container">
                        <Button
                          type="button"
                          ref={(el) => { shareButtonRefs.current[index] = el; }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const button = shareButtonRefs.current[index];
                            if (button) {
                              const rect = button.getBoundingClientRect();
                              onSetShareMenuPosition(index, { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
                            }
                            onToggleShareMenu(index);
                          }}
                          variant="outline"
                          size="sm"
                          className="rounded-lg flex-shrink-0"
                          title={t.share}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {showShareMenu[index] && shareMenuPosition[index] && (
                          <div 
                            className="fixed bg-white dark:bg-[#141414] rounded-lg shadow-lg border border-gray-100 dark:border-[#8B8C8D]/20 p-1 z-[100] w-auto share-menu-container"
                            style={{ 
                              top: `${shareMenuPosition[index].top}px`, 
                              left: `${shareMenuPosition[index].left}px` 
                            }}
                            data-share-menu={index}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "twitter");
                                onToggleShareMenu(index);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                            >
                              Twitter
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "facebook");
                                onToggleShareMenu(index);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                            >
                              Facebook
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "whatsapp");
                                onToggleShareMenu(index);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                            >
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "telegram");
                                onToggleShareMenu(index);
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleQrCode(index);
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fullUrl = typeof window !== "undefined"
                            ? `${getBaseUrl()}${item.url}`
                            : item.url;
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDownload(item.fileName, item.url);
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-shrink-0"
                        title={t.download}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleImageInfo(index);
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-shrink-0"
                        title={t.imageInfo}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                {showQrCode[index] && (
                  <div className="bg-white dark:bg-[#141414] rounded-lg p-4 border border-gray-100 dark:border-[#8B8C8D]/20 flex flex-col items-center gap-2">
                    <p className="text-xs font-light text-gray-600 dark:text-gray-400">{t.qrCode}</p>
                    <QRCodeSVG
                      value={`${getBaseUrl()}${item.url}`}
                      size={128}
                    />
                  </div>
                )}
                {showImageInfo[index] && imageMetadata[files.find(f => uploadedUrls.find(u => u.fileName === item.fileName))?.name || ""] && (
                  <div className="bg-white dark:bg-[#141414] rounded-lg p-4 border border-gray-100 dark:border-[#8B8C8D]/20 space-y-2">
                    <p className="text-xs font-light text-gray-600 dark:text-gray-400 mb-2">{t.imageInfo}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-[#8B8C8D]">{t.dimensions}:</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {imageMetadata[files.find(f => uploadedUrls.find(u => u.fileName === item.fileName))?.name || ""]?.width} × {imageMetadata[files.find(f => uploadedUrls.find(u => u.fileName === item.fileName))?.name || ""]?.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-[#8B8C8D]">{t.format}:</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {imageMetadata[files.find(f => uploadedUrls.find(u => u.fileName === item.fileName))?.name || ""]?.format.split("/")[1]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-[#8B8C8D]">{t.fileSize}:</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {formatFileSize(imageMetadata[files.find(f => uploadedUrls.find(u => u.fileName === item.fileName))?.name || ""]?.size || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedUrls.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#8B8C8D]/20 aspect-square">
                  {item.hasPassword ? (
                    <div className="flex flex-col items-center justify-center p-8 min-h-[150px]">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#8B8C8D]/20 flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5 text-gray-400 dark:text-[#8B8C8D]" />
                      </div>
                      <p className="text-xs font-light text-gray-500 dark:text-[#8B8C8D]">
                        {t.passwordProtection}
                      </p>
                    </div>
                  ) : (
                    <img
                      src={`/api/image/${item.fileName}`}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="text"
                    value={`${getBaseUrl()}${item.url}`}
                    readOnly
                    className="flex-1 min-w-0 text-xs"
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
                      e.nativeEvent.stopImmediatePropagation();
                      onCopyUrl(item.url);
                      return false;
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-lg flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!item.hasPassword && (
                    <>
                      <div className="relative share-menu-container">
                        <Button
                          type="button"
                          ref={(el) => { shareButtonRefs.current[index] = el; }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const button = shareButtonRefs.current[index];
                            if (button) {
                              const rect = button.getBoundingClientRect();
                              onSetShareMenuPosition(index, { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
                            }
                            onToggleShareMenu(index);
                          }}
                          variant="outline"
                          size="sm"
                          className="rounded-lg flex-shrink-0"
                          title={t.share}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {showShareMenu[index] && shareMenuPosition[index] && (
                          <div 
                            className="fixed bg-white dark:bg-[#141414] rounded-lg shadow-lg border border-gray-100 dark:border-[#8B8C8D]/20 p-1 z-[100] w-auto share-menu-container"
                            style={{ 
                              top: `${shareMenuPosition[index].top}px`, 
                              left: `${shareMenuPosition[index].left}px` 
                            }}
                            data-share-menu={index}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "twitter");
                                onToggleShareMenu(index);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                            >
                              Twitter
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "facebook");
                                onToggleShareMenu(index);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                            >
                              Facebook
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "whatsapp");
                                onToggleShareMenu(index);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#8B8C8D]/10 rounded transition-colors"
                            >
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareUrl(item.url, "telegram");
                                onToggleShareMenu(index);
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleQrCode(index);
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fullUrl = typeof window !== "undefined"
                            ? `${getBaseUrl()}${item.url}`
                            : item.url;
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDownload(item.fileName, item.url);
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-shrink-0"
                        title={t.download}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleImageInfo(index);
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-shrink-0"
                        title={t.imageInfo}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {uploadedUrls.length > 1 && (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBulkDownload();
            }}
            variant="outline"
            className="flex-1 rounded-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.downloadAll}
          </Button>
        )}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          variant="outline"
          className={uploadedUrls.length > 1 ? "flex-1 rounded-lg" : "w-full rounded-lg"}
        >
          {t.uploadAnother}
        </Button>
      </div>
    </div>
  );
}

