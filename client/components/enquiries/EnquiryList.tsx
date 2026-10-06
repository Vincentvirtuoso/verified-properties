"use client";

import type { Enquiry } from "@/types/enquiry";
import { formatRelativeTime } from "@/lib/formatters";
import { Avatar } from "../ui/Avatar";

interface EnquiryListProps {
  enquiries: Enquiry[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isAgentSide: boolean;
}

export function EnquiryList({
  enquiries,
  selectedId,
  onSelect,
  isAgentSide,
}: EnquiryListProps) {
  if (enquiries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isAgentSide
            ? "No enquiries yet on your listings."
            : "You haven't enquired about any properties yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-border">
      {enquiries.map((enquiry) => {
        const isActive = enquiry.id === selectedId;
        return (
          <button
            key={enquiry.id}
            onClick={() => onSelect(enquiry.id)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
              isActive ? "bg-primary/5" : "hover:bg-muted/30"
            }`}
          >
            <Avatar
              src={enquiry.propertyImage}
              name={isAgentSide ? enquiry.propertyTitle : enquiry.agentName}
              size={50}
              shape="square"
            />
            {/* <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-muted">
              <Image
                src={enquiry.propertyImage}
                alt={enquiry.propertyTitle}
                fill
                className="object-cover"
              />
            </div> */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {isAgentSide ? enquiry.buyerName : enquiry.propertyTitle}
                </p>
                {enquiry.unreadCount > 0 && (
                  <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {isAgentSide ? enquiry.propertyTitle : enquiry.agentName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {enquiry.lastEventPreview}
                </p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatRelativeTime(enquiry.lastEventAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
