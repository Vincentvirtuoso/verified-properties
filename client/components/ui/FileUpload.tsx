"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiImage,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";

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
  maxFiles?: number;
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
  maxFiles = 5,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const updatedFiles = [...files];
    const availableSlots = maxFiles - updatedFiles.length;

    if (availableSlots <= 0) {
      alert(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const filesToProcess = Array.from(incomingFiles).slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const id = Math.random().toString(36).substring(7);
      const isTypeAllowed = allowedTypes.some((type) => {
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
        newFile.errorMessage = "Unsupported file type.";
      } else if (!isSizeAllowed) {
        newFile.status = "error";
        newFile.errorMessage = `File exceeds ${maxSizeInMB}MB limit.`;
      } else {
        // Automatically simulate upload if file is valid
        newFile.status = "uploading";
        simulateUpload(id);
      }

      updatedFiles.push(newFile);
    });

    setFiles(updatedFiles);
  };

  // Replace this with your actual API endpoint logic (Axios, XHR, etc.)
  const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === id) {
              const updated = { ...f, status: "success" as const, progress };
              // Fire completion callback for valid items
              triggerCompleteCallback();
              return updated;
            }
            return f;
          }),
        );
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress } : f)),
        );
      }
    }, 200);
  };

  const triggerCompleteCallback = () => {
    if (onUploadComplete) {
      const successfulFiles = files
        .filter((f) => f.status === "success")
        .map((f) => f.file);
      onUploadComplete(successfulFiles);
    }
  };

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
        URL.revokeObjectURL(target.previewUrl); // Free memory
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-card border border-border shadow-sm rounded-xl">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`group relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 outline-none
          ${
            isDragging
              ? "border-primary-500 bg-primary-50/40 scale-[0.99]"
              : "border-input hover:border-primary-400 hover:bg-background"
          }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept={allowedTypes.join(",")}
        />

        <div className="flex flex-col items-center justify-center p-5 text-center">
          <div
            className={`p-3 bg- rounded-lg mb-3 border border-border group-hover:scale-110 transition-transform duration-200 ${isDragging && "bg-primary-100 border-primary-200 text-primary-600"}`}
          >
            <FiUploadCloud className="w-6 h-6 text-slate-500 group-hover:text-primary-500 transition-colors" />
          </div>
          <p className="mb-1 text-sm font-semibold text-text-subtle">
            <span className="text-primary-600">Click to upload</span> or drag
            and drop
          </p>
          <p className="text-xs text-text-muted">
            Images and Documents up to {maxSizeInMB}MB (Max {maxFiles} files)
          </p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Uploaded Files ({files.length}/{maxFiles})
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
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
