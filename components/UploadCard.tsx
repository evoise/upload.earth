"use client";

import { useRef } from "react";
import { Upload, X, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translations, type Language } from "@/lib/translations";

interface UploadCardProps {
  darkMode: boolean;
  language: Language;
  isDragging: boolean;
  files: File[];
  previews: { file: File; preview: string }[];
  uploading: boolean;
  progress: number;
  currentUploadIndex: number;
  customFileName: string;
  retentionTime: number;
  retentionMode: "preset" | "custom";
  customRetentionHours: string;
  imagePassword: string;
  confirmImagePassword: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onCustomFileNameChange: (value: string) => void;
  onRetentionModeChange: (value: "preset" | "custom") => void;
  onRetentionTimeChange: (value: number) => void;
  onCustomRetentionHoursChange: (value: string) => void;
  onImagePasswordChange: (value: string) => void;
  onConfirmImagePasswordChange: (value: string) => void;
  onUpload: () => void;
  onClear: () => void;
}

export default function UploadCard({
  darkMode,
  language,
  isDragging,
  files,
  previews,
  uploading,
  progress,
  currentUploadIndex,
  customFileName,
  retentionTime,
  retentionMode,
  customRetentionHours,
  imagePassword,
  confirmImagePassword,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onRemoveFile,
  onCustomFileNameChange,
  onRetentionModeChange,
  onRetentionTimeChange,
  onCustomRetentionHoursChange,
  onImagePasswordChange,
  onConfirmImagePasswordChange,
  onUpload,
  onClear,
}: UploadCardProps) {
  const t = translations[language];

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-100 dark:border-[#8B8C8D]/20 p-8 transition-all duration-300 relative overflow-visible" style={{ backgroundColor: darkMode ? '#141414' : '#ffffff', opacity: darkMode ? 1 : 1 }}>
      {previews.length === 0 ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 bg-gray-50 dark:!bg-[#141414] ${isDragging
            ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.02]"
            : "border-gray-200 dark:border-[#8B8C8D]/30 hover:border-gray-300 dark:hover:border-[#8B8C8D]/50"
            }`}
          style={{ backgroundColor: darkMode ? '#141414' : '#f9fafb' }}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-gray-100 dark:bg-[#8B8C8D]/20 text-gray-400 dark:text-[#8B8C8D]"
                }`}
            >
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-white font-light text-sm mb-1">
                {t.dragDrop}
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded-lg"
              >
                {files.length > 0 ? t.selectFiles : t.selectFile}
              </Button>
            </div>
            <p className="text-xs text-gray-400 dark:text-[#8B8C8D] font-light">
              {t.supported}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {previews.length === 1 ? (
            <div className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#8B8C8D]/20 max-w-md mx-auto">
              <img
                src={previews[0].preview}
                alt="Preview"
                className="w-full h-auto max-h-[300px] object-contain mx-auto"
              />
              {!uploading && (
                <button
                  onClick={() => onRemoveFile(0)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-[#141414] hover:bg-white dark:hover:bg-[#141414] shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5 text-gray-600 dark:text-white" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {previews.map((previewData, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#8B8C8D]/20 aspect-square">
                  <img
                    src={previewData.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {!uploading && (
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-[#141414] hover:bg-white dark:hover:bg-[#141414] shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600 dark:text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              {files.length === 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-600 dark:text-gray-400">
                    {t.customFileName}
                  </label>
                  <Input
                    type="text"
                    value={customFileName}
                    onChange={(e) => onCustomFileNameChange(e.target.value)}
                    placeholder="my-image"
                    className="w-full"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    name="customFileName"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-light text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.retentionTime}
                </label>
                <div className="flex gap-2">
                  <Select
                    value={retentionMode}
                    onValueChange={(value) => onRetentionModeChange(value as "preset" | "custom")}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-2rem)]">
                      <SelectItem value="preset">Preset</SelectItem>
                      <SelectItem value="custom">{t.retentionCustom}</SelectItem>
                    </SelectContent>
                  </Select>
                  {retentionMode === "preset" ? (
                    <Select
                      value={retentionTime.toString()}
                      onValueChange={(value) => onRetentionTimeChange(Number(value))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t.retentionPermanent} />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)]">
                        <SelectItem value="0">{t.retentionPermanent}</SelectItem>
                        <SelectItem value="3600">{t.retention1Hour}</SelectItem>
                        <SelectItem value="86400">{t.retention24Hours}</SelectItem>
                        <SelectItem value="604800">{t.retention7Days}</SelectItem>
                        <SelectItem value="2592000">{t.retention30Days}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="number"
                      value={customRetentionHours}
                      onChange={(e) => onCustomRetentionHoursChange(e.target.value)}
                      placeholder={t.retentionCustomPlaceholder}
                      className="flex-1"
                      min="1"
                    />
                  )}
                </div>
              </div>
              {files.length === 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {t.passwordProtection}
                  </label>
                  <Input
                    type="password"
                    value={imagePassword}
                    onChange={(e) => onImagePasswordChange(e.target.value)}
                    placeholder={t.enterPassword}
                    className="w-full"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    name="imagePassword"
                  />
                  {imagePassword && (
                    <Input
                      type="password"
                      value={confirmImagePassword}
                      onChange={(e) => onConfirmImagePasswordChange(e.target.value)}
                      placeholder={t.confirmPassword}
                      className="w-full"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      name="confirmImagePassword"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-white font-light">
                  {t.uploadingFile} {currentUploadIndex} {t.of} {files.length}
                </span>
                <span className="text-gray-500 dark:text-[#8B8C8D] font-light">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {!uploading && (
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpload();
                }}
                className="flex-1 rounded-lg"
                disabled={files.length === 0}
              >
                {t.uploadToS3} {files.length > 0 && `(${files.length})`}
              </Button>
              <Button
                variant="outline"
                onClick={onClear}
                className="rounded-lg"
              >
                {t.clear}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

