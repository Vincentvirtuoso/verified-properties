import { Button } from "@affilhomes/shared/ui";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuArrowLeft,
  LuHouse,
  LuRefreshCw,
  LuTriangleAlert,
  LuUserX,
} from "react-icons/lu";

type Variant = "not-found" | "error";

interface AgentUnavailableProps {
  variant?: Variant;
  agentId?: string;
}

const COPY: Record<
  Variant,
  { icon: IconType; iconClass: string; title: string; description: string }
> = {
  "not-found": {
    icon: LuUserX,
    iconClass: "bg-muted/40 text-muted",
    title: "We couldn't find this agent",
    description:
      "This profile may have been removed, or the link you followed may be incorrect.",
  },
  error: {
    icon: LuTriangleAlert,
    iconClass: "bg-red-50 text-red-500",
    title: "We couldn't load this agent",
    description:
      "Something went wrong on our end. Please try again in a moment.",
  },
};

export function AgentUnavailable({
  variant = "not-found",
  agentId,
}: AgentUnavailableProps) {
  const { icon: Icon, iconClass, title, description } = COPY[variant];

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <section
        role="alert"
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8 text-center"
      >
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${iconClass}`}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {variant === "error" && agentId && (
            <Link
              href={`/agents/${agentId}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
            >
              <LuRefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Link>
          )}
          <Button
            leftIcon={<LuArrowLeft className="h-4 w-4" aria-hidden="true" />}
            variant="secondary"
            href="/agents"
            fullWidth
          >
            Browse agents
          </Button>
          <Button
            href="/"
            variant="ghost"
            leftIcon={<LuHouse className="h-4 w-4" aria-hidden="true" />}
            fullWidth
          >
            Home
          </Button>
        </div>
      </section>
    </main>
  );
}
