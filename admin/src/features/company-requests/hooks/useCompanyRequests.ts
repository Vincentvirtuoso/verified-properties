"use client";

import { useCallback, useState } from "react";
import { useAdminList } from "@/hooks/useAdminList";
import {
  getCacDocumentUrl,
  listPendingCompanyRequests,
  type CompanyRequest,
} from "../api/companyRequests";

export function useCompanyRequests() {
  const { rows, error, reload, loading } = useAdminList<CompanyRequest>(
    () => listPendingCompanyRequests(),
    [],
  );
  const [documentError, setDocumentError] = useState<string | null>(null);

  const openDocument = useCallback(async (path: string) => {
    setDocumentError(null);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;

    try {
      const url = await getCacDocumentUrl(path);
      if (tab) {
        tab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      tab?.close();
      setDocumentError(
        err instanceof Error ? err.message : "Could not open the document.",
      );
    }
  }, []);

  return { rows, error, reload, openDocument, documentError, loading };
}
