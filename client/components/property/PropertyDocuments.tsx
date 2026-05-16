"use client";

import { motion } from "framer-motion";
import { RiFileLine, RiDownloadLine, RiShieldCheckLine } from "react-icons/ri";
import { PropertyDocument } from "@/types/property";
import { DOCUMENT_TYPE_LABELS } from "@/utils/constants";

interface PropertyDocumentsProps {
  documents: PropertyDocument[];
}

export default function PropertyDocuments({
  documents,
}: PropertyDocumentsProps) {
  if (!documents || documents.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <RiShieldCheckLine size={18} className="text-violet-500" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Legal Documents
        </h2>
        <span className="ml-auto text-xs font-semibold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
          {documents.length}
        </span>
      </div>

      <div className="grid gap-2.5">
        {documents.map((doc, idx) => (
          <motion.a
            key={doc.id || idx}
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-all duration-200 group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx }}
          >
            <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <RiFileLine
                size={18}
                className="text-violet-600 dark:text-violet-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {doc.title || DOCUMENT_TYPE_LABELS[doc.type]}
              </p>
              {doc.title && doc.title !== DOCUMENT_TYPE_LABELS[doc.type] && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                  {DOCUMENT_TYPE_LABELS[doc.type]}
                </p>
              )}
              {doc.uploadedAt && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {new Date(doc.uploadedAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <RiDownloadLine
              size={16}
              className="text-neutral-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors shrink-0"
            />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
