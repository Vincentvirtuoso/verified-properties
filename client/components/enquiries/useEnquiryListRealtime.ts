"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createClient } from "@affilhomes/shared/supabase/client";
import type { Enquiry } from "@affilhomes/shared/types/enquiry";

type InquiryMessageRow = {
  id: string;
  inquiry_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
};

interface Options {
  viewerId?: string;
  selectedId?: string | null;
  enquiries: Enquiry[];
  setEnquiries: Dispatch<SetStateAction<Enquiry[]>>;
  onUnknownEnquiry?: () => void;
  enabled?: boolean;
}

export function useEnquiryListRealtime({
  viewerId,
  selectedId,
  enquiries,
  setEnquiries,
  onUnknownEnquiry,
  enabled = true,
}: Options) {
  const selectedIdRef = useRef(selectedId);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const onUnknownRef = useRef(onUnknownEnquiry);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    knownIdsRef.current = new Set(enquiries.map((e) => e.id));
  }, [enquiries]);

  useEffect(() => {
    onUnknownRef.current = onUnknownEnquiry;
  }, [onUnknownEnquiry]);

  useEffect(() => {
    if (!enabled || !viewerId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`enquiry-list-${viewerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inquiry_messages" },
        (payload) => {
          const row = payload.new as InquiryMessageRow;

          if (row.sender_id === viewerId) return;

          if (row.inquiry_id === selectedIdRef.current) return;

          if (!knownIdsRef.current.has(row.inquiry_id)) {
            onUnknownRef.current?.();
            return;
          }

          setEnquiries((prev) =>
            prev.map((e) =>
              e.id === row.inquiry_id
                ? {
                    ...e,
                    unreadCount: e.unreadCount + 1,
                    lastEventPreview: row.content,
                    lastEventAt: new Date(row.sent_at),
                  }
                : e,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerId, enabled, setEnquiries]);
}
