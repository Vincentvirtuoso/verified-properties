import React from "react";

export function SupportIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bg-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.15)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
        </linearGradient>
        <linearGradient id="agent-shirt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>
        <linearGradient id="laptop-screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <filter id="drop-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="8"
            floodColor="#0f172a"
            floodOpacity="0.08"
          />
        </filter>
      </defs>

      <circle cx="300" cy="230" r="220" fill="url(#bg-glow)" />
      <circle cx="150" cy="150" r="8" fill="#818CF8" opacity="0.4" />
      <circle cx="460" cy="320" r="5" fill="#C084FC" opacity="0.4" />
      <circle cx="420" cy="100" r="6" fill="#6366F1" opacity="0.3" />

      <path
        d="M60 400H540C551.046 400 560 408.954 560 420V430H40V420C40 408.954 48.9543 400 60 400Z"
        fill="var(--muted, #E2E8F0)"
        opacity="0.7"
      />
      <rect
        x="80"
        y="430"
        width="16"
        height="70"
        rx="4"
        fill="var(--border, #CBD5E1)"
        opacity="0.5"
      />
      <rect
        x="504"
        y="430"
        width="16"
        height="70"
        rx="4"
        fill="var(--border, #CBD5E1)"
        opacity="0.5"
      />

      <g id="agent">
        <path
          d="M230 400C230 330 250 310 300 310C350 310 370 330 370 400H230Z"
          fill="url(#agent-shirt)"
        />
        <rect x="288" y="285" width="24" height="30" rx="4" fill="#FDBA74" />
        <circle cx="300" cy="245" r="45" fill="#FDBA74" />
        <path
          d="M255 240C255 200 280 195 300 195C320 195 345 200 345 240C345 210 335 205 300 205C265 205 255 210 255 240Z"
          fill="#1E293B"
        />
        <path
          d="M255 230C252 245 258 255 260 255"
          stroke="#1E293B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="288" cy="242" r="3" fill="#1E293B" />
        <circle cx="312" cy="242" r="3" fill="#1E293B" />
        <path
          d="M293 260C293 265 307 265 307 260"
          stroke="#1E293B"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M252 245C252 210 270 197 300 197C330 197 348 210 348 245"
          fill="none"
          stroke="#0F172A"
          strokeWidth="5"
        />
        <rect x="247" y="235" width="8" height="22" rx="4" fill="#6366F1" />
        <rect x="345" y="235" width="8" height="22" rx="4" fill="#6366F1" />
        <path
          d="M253 250C265 262 278 262 282 260"
          fill="none"
          stroke="#0F172A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="284" cy="260" r="3" fill="#6366F1" />
      </g>

      <g id="laptop">
        <rect x="220" y="325" width="160" height="10" rx="3" fill="#94A3B8" />
        <path
          d="M225 325L240 255H360L375 325H225Z"
          fill="#0F172A"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        <path
          d="M243 259L255 320H345L357 259H243Z"
          fill="url(#laptop-screen)"
          opacity="0.85"
        />
        <line
          x1="265"
          y1="275"
          x2="335"
          y2="275"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="275"
          y1="287"
          x2="325"
          y2="287"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="300" cy="305" r="8" fill="#FFFFFF" opacity="0.6" />

        <path
          d="M200 392C200 392 210 400 225 400H375C390 400 400 392 400 392V397H200V392Z"
          fill="#CBD5E1"
        />
        <rect x="270" y="394" width="60" height="4" rx="2" fill="#94A3B8" />
      </g>

      <g id="ticket-left" filter="url(#drop-shadow)">
        <rect
          x="40"
          y="160"
          width="160"
          height="85"
          rx="16"
          fill="var(--card, #FFFFFF)"
          stroke="var(--border, #E2E8F0)"
          strokeWidth="1.5"
        />
        <path
          d="M40 176C40 167.163 47.1634 160 56 160H184C192.837 160 200 167.163 200 176V180H40V176Z"
          fill="#6366F1"
        />
        <circle cx="60" cy="170" r="4" fill="#34D399" />
        <rect
          x="72"
          y="167"
          width="60"
          height="6"
          rx="3"
          fill="#FFFFFF"
          opacity="0.9"
        />
        <rect
          x="56"
          y="196"
          width="128"
          height="6"
          rx="3"
          fill="var(--muted-foreground, #94A3B8)"
          opacity="0.4"
        />
        <rect
          x="56"
          y="208"
          width="96"
          height="6"
          rx="3"
          fill="var(--muted-foreground, #94A3B8)"
          opacity="0.2"
        />
        <circle cx="170" cy="215" r="14" fill="#EEF2F6" />
        <path
          d="M166 211H174C175.105 211 176 211.895 176 213V218L172 215H166C164.895 215 164 214.105 164 213V211Z"
          fill="#6366F1"
        />
      </g>

      <g id="ticket-top-right" filter="url(#drop-shadow)">
        <rect
          x="380"
          y="80"
          width="170"
          height="90"
          rx="16"
          fill="var(--card, #FFFFFF)"
          stroke="var(--border, #E2E8F0)"
          strokeWidth="1.5"
        />
        <rect x="396" y="98" width="40" height="18" rx="9" fill="#FEE2E2" />
        <rect x="404" y="104" width="24" height="6" rx="3" fill="#EF4444" />
        <circle cx="524" cy="107" r="5" fill="#EF4444" /> {/* Alert Dot */}
        <rect
          x="396"
          y="128"
          width="138"
          height="6"
          rx="3"
          fill="var(--muted-foreground, #94A3B8)"
          opacity="0.4"
        />
        <rect
          x="396"
          y="140"
          width="110"
          height="6"
          rx="3"
          fill="var(--muted-foreground, #94A3B8)"
          opacity="0.2"
        />
      </g>

      <g id="ticket-bottom-right" filter="url(#drop-shadow)">
        <rect
          x="410"
          y="210"
          width="150"
          height="80"
          rx="16"
          fill="var(--card, #FFFFFF)"
          stroke="var(--border, #E2E8F0)"
          strokeWidth="1.5"
        />
        <path
          d="M410 226C410 217.163 417.163 210 426 210H544C552.837 210 560 217.163 560 226V230H410V226Z"
          fill="#10B981"
        />
        <circle cx="434" cy="256" r="12" fill="#D1FAE5" />
        <path
          d="M429 256L432 259L439 252"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="456"
          y="250"
          width="80"
          height="6"
          rx="3"
          fill="var(--muted-foreground, #94A3B8)"
          opacity="0.4"
        />
        <rect
          x="456"
          y="262"
          width="50"
          height="6"
          rx="3"
          fill="var(--muted-foreground, #94A3B8)"
          opacity="0.2"
        />
      </g>

      <path
        d="M200 200C240 200 220 270 240 270"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
        opacity="0.3"
      />
      <path
        d="M380 130C340 130 360 260 350 260"
        stroke="#A855F7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
        opacity="0.3"
      />
    </svg>
  );
}
