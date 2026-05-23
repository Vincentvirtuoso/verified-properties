"use client";

import React, {
  useState,
  useRef,
  DragEvent,
  ChangeEvent,
  useEffect,
} from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiImage,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiCamera,
  FiFolder,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface FileWithMeta {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  previewUrl?: string;
  errorMessage?: string;
}

interface FileUploadProps {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  onUploadComplete?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  maxFiles?: number;
  variant?: "default" | "avatar" | "document";
  label?: string;
  description?: string;
  className?: string;
  accept?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function FileUpload({
  maxSizeInMB = 5,
  allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  onUploadComplete,
  onFileRemove,
  maxFiles = 5,
  variant = "default",
  label,
  description,
  className,
  accept,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [reportedCompleteIds, setReportedCompleteIds] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configure variant-specific settings
  const getVariantConfig = () => {
    switch (variant) {
      case "avatar":
        return {
          maxFiles: 1,
          allowedTypes: allowedTypes.filter((t) => t.startsWith("image/")),
          showPreview: true,
          showProgress: false,
          showSize: false,
          layout: "compact",
        };
      case "document":
        return {
          maxFiles: maxFiles,
          allowedTypes: allowedTypes.filter(
            (t) =>
              t.startsWith("application/") ||
              t === "text/plain" ||
              t === "text/csv",
          ),
          showPreview: false,
          showProgress: true,
          showSize: true,
          layout: "list",
        };
      default:
        return {
          maxFiles: maxFiles,
          allowedTypes: allowedTypes,
          showPreview: true,
          showProgress: true,
          showSize: true,
          layout: "grid",
        };
    }
  };

  const config = getVariantConfig();
  const effectiveMaxFiles = config.maxFiles;
  const effectiveAllowedTypes = config.allowedTypes;

  // Process uploaded files
  const processFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const updatedFiles = [...files];
    const availableSlots = effectiveMaxFiles - updatedFiles.length;

    if (availableSlots <= 0) {
      alert(`You can only upload a maximum of ${effectiveMaxFiles} file(s).`);
      return;
    }

    const filesToProcess = Array.from(incomingFiles).slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const id = Math.random().toString(36).substring(7);
      const isTypeAllowed = effectiveAllowedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", ""));
        }
        return file.type === type;
      });
      const isSizeAllowed = file.size <= maxSizeInMB * 1024 * 1024;

      const newFile: FileWithMeta = {
        id,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        status: "idle",
        progress: 0,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      };

      if (!isTypeAllowed) {
        newFile.status = "error";
        newFile.errorMessage = `Unsupported file type. Allowed: ${effectiveAllowedTypes
          .map((t) => t.split("/").pop())
          .join(", ")}`;
      } else if (!isSizeAllowed) {
        newFile.status = "error";
        newFile.errorMessage = `File exceeds ${maxSizeInMB}MB limit.`;
      } else {
        newFile.status = "uploading";
        simulateUpload(id);
      }

      updatedFiles.push(newFile);
    });

    setFiles(updatedFiles);
  };

  // Simulate upload progress
  const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "success" as const, progress } : f,
          ),
        );
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress } : f)),
        );
      }
    }, 200);
  };

  // Trigger onUploadComplete when a file becomes "success"
  useEffect(() => {
    if (!onUploadComplete) return;

    const successfullyUploadedFiles = files.filter(
      (f) => f.status === "success" && !reportedCompleteIds.has(f.id),
    );

    if (successfullyUploadedFiles.length > 0) {
      console.log(
        "Files uploaded successfully:",
        successfullyUploadedFiles.map((f) => f.file),
      );
      onUploadComplete(successfullyUploadedFiles.map((f) => f.file));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReportedCompleteIds((prev) => {
        const newSet = new Set(prev);
        successfullyUploadedFiles.forEach((f) => newSet.add(f.id));
        return newSet;
      });
    }
  }, [files, onUploadComplete, reportedCompleteIds]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    // Also remove from reported set
    setReportedCompleteIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    onFileRemove?.(id);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("image")) return "🖼️";
    return "📁";
  };

  // ===== Avatar variant =====
  if (variant === "avatar") {
    const currentFile = files[0];
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        {label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
        <div
          onClick={triggerFileInput}
          className={cn(
            "relative w-28 h-28 rounded-full border-2 border-dashed cursor-pointer overflow-hidden group transition-all",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple={false}
            className="hidden"
            accept={accept || effectiveAllowedTypes.join(",")}
          />
          {currentFile?.previewUrl && currentFile.status !== "error" ? (
            <Image
              fill
              src={currentFile.previewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <FiCamera className="w-6 h-6 mb-1" />
              <span className="text-[10px]">Upload logo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <FiUploadCloud className="w-5 h-5 text-white" />
          </div>
        </div>
        {description && <p className="text-xs text-muted">{description}</p>}
        {currentFile && currentFile.status === "error" && (
          <p className="text-xs text-destructive">{currentFile.errorMessage}</p>
        )}
        {currentFile && currentFile.status === "uploading" && (
          <p className="text-xs text-primary">Uploading...</p>
        )}
        {currentFile && currentFile.status === "success" && (
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-emerald-600">Logo uploaded</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile(currentFile.id);
              }}
              className="text-xs text-muted hover:text-destructive"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== Document variant =====
  if (variant === "document") {
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
            isDragging
              ? "border-primary-500 bg-primary-50/40"
              : "border-input hover:border-primary-400 hover:bg-background",
            files.length > 0 && "mb-4",
          )}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple={effectiveMaxFiles > 1}
            className="hidden"
            accept={accept || effectiveAllowedTypes.join(",")}
          />
          <FiFolder className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {description ||
              `Upload documents (${effectiveAllowedTypes
                .map((t) => t.split("/").pop()?.toUpperCase())
                .join(", ")}) up to ${maxSizeInMB}MB`}
          </p>
          {effectiveMaxFiles > 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              Max {effectiveMaxFiles} files
            </p>
          )}
        </div>
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((fileMeta) => (
              <div
                key={fileMeta.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg group hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl">{getFileIcon(fileMeta.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fileMeta.name}
                    </p>
                    {config.showSize && (
                      <p className="text-xs text-muted-foreground">
                        {fileMeta.size}
                      </p>
                    )}
                    {fileMeta.status === "uploading" && config.showProgress && (
                      <div className="mt-1.5 w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all duration-200"
                          style={{ width: `${fileMeta.progress}%` }}
                        />
                      </div>
                    )}
                    {fileMeta.status === "error" && (
                      <p className="text-xs text-red-500 mt-1">
                        {fileMeta.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {fileMeta.status === "uploading" && (
                    <FiLoader className="w-4 h-4 text-primary-500 animate-spin" />
                  )}
                  {fileMeta.status === "success" && (
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileMeta.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove file"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Default variant =====
  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto p-6 bg-card border border-border shadow-sm rounded-xl",
        className,
      )}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={cn(
          "group relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 outline-none",
          isDragging
            ? "border-primary-500 bg-primary-50/40 scale-[0.99]"
            : "border-input hover:border-primary-400 hover:bg-background",
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept={accept || effectiveAllowedTypes.join(",")}
        />
        <div className="flex flex-col items-center justify-center p-5 text-center">
          <div
            className={cn(
              "p-3 rounded-lg mb-3 border border-border group-hover:scale-110 transition-transform duration-200",
              isDragging &&
                "bg-primary-100 border-primary-200 text-primary-600",
            )}
          >
            <FiUploadCloud className="w-6 h-6 text-slate-500 group-hover:text-primary-500 transition-colors" />
          </div>
          <p className="mb-1 text-sm font-semibold text-text-subtle">
            <span className="text-primary-600">Click to upload</span> or drag
            and drop
          </p>
          <p className="text-xs text-text-muted">
            {description ||
              `Files up to ${maxSizeInMB}MB (Max ${effectiveMaxFiles} files)`}
          </p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Uploaded Files ({files.length}/{effectiveMaxFiles})
            </h4>
          </div>
          <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
            {files.map((fileMeta) => {
              const isImage = fileMeta.type.startsWith("image/");
              return (
                <div
                  key={fileMeta.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0 w-10 h-10 bg-white border border-slate-200 rounded-md overflow-hidden flex items-center justify-center">
                      {isImage && fileMeta.previewUrl ? (
                        <Image
                          fill
                          src={fileMeta.previewUrl}
                          alt={fileMeta.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isImage ? (
                        <FiImage className="w-5 h-5 text-slate-400" />
                      ) : (
                        <FiFileText className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate max-w-55 sm:max-w-[320px]">
                        {fileMeta.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {fileMeta.size}
                        </span>
                        {fileMeta.status === "uploading" && (
                          <span className="text-xs text-primary-500 font-medium">
                            • {fileMeta.progress}%
                          </span>
                        )}
                        {fileMeta.status === "error" && (
                          <span className="text-xs text-rose-500 font-medium flex items-center gap-0.5">
                            <FiAlertCircle className="inline" />{" "}
                            {fileMeta.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fileMeta.status === "uploading" && (
                      <FiLoader className="w-4 h-4 text-primary-500 animate-spin" />
                    )}
                    {fileMeta.status === "success" && (
                      <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileMeta.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded transition-colors"
                      aria-label="Remove file"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
