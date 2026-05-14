"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiVerifiedBadgeLine,
  RiBuildingLine,
} from "react-icons/ri";
import { Agent } from "@/types/property";
import Link from "next/link";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const whatsappUrl = agent.phone
    ? `https://wa.me/${agent.phone.replace(/\D/g, "")}`
    : null;
  const defaultAgentImage = "/placeholder_agent.png";
  const [agentImageSrc, setAgentImageSrc] = useState(
    agent?.image || defaultAgentImage,
  );

  return (
    <motion.div
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      <div className="h-2 bg-linear-to-r from-violet-500 to-violet-700" />

      <div className="p-5 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
          Listed by
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-violet-100 dark:bg-violet-900/40 shrink-0 ring-2 ring-violet-100 dark:ring-violet-900">
            <Image
              src={agentImageSrc}
              alt={agent.name}
              fill
              loader={imageLoader}
              onError={() => setAgentImageSrc(defaultAgentImage)}
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {agent.name}
              </p>
              {agent.verified && (
                <RiVerifiedBadgeLine
                  size={16}
                  className="text-violet-500 shrink-0"
                />
              )}
            </div>
            {agent.company && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                <RiBuildingLine size={13} className="shrink-0" />
                {agent.company}
              </p>
            )}
            {agent.verified && (
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                Verified Agent
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all duration-200 group"
            >
              <RiPhoneLine size={16} className="shrink-0" />
              <span className="truncate">{agent.phone}</span>
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all duration-200"
            >
              <RiWhatsappLine size={16} className="shrink-0" />
            </a>
          )}

          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium text-sm transition-all duration-200"
            >
              <RiMailLine size={16} className="shrink-0 text-violet-500" />
              <span className="truncate">{agent.email}</span>
            </a>
          )}
        </div>
        <Link
          href={`/agents/${agent.id}`}
          className="ml-auto bg-primary text-white py-2 px-4 text-[13px] rounded-xl hover:bg-primary/80 mt-4"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}
