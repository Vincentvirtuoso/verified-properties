"use client";

import { PopulatedUser, Role } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  LuUserCheck,
  LuBuilding2,
  LuLayoutDashboard,
  LuTrendingUp,
  LuMegaphone,
  LuUsers,
  LuSearch,
  LuStar,
  LuCirclePlus,
  LuInfo,
} from "react-icons/lu";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner } from "@/components/ui/Spinner";
import { BsArrowRight } from "react-icons/bs";
import RoleIcon from "@/components/ui/RoleIcon";

interface Step {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

interface RoleGuide {
  title: string;
  description: string;
  steps: Step[];
  extraInfo?: { label: string; content: string };
}

const roleGuides: Record<Role, RoleGuide> = {
  [Role.Viewer]: {
    title: "Welcome, Explorer!",
    description:
      "You're browsing as a viewer. Discover properties and start your journey in real estate.",
    steps: [
      {
        icon: <LuSearch />,
        label: "Browse JV opportunities",
        href: "/jv-properties",
      },
      {
        icon: <LuStar />,
        label: "Save your favourite listings",
        href: "/saved-properties",
      },
      {
        icon: <LuUserCheck />,
        label: "Become an Agent",
        href: "/onboarding/become-an-agent",
      },
      {
        icon: <LuBuilding2 />,
        label: "Register a Company",
        href: "/onboarding/company",
      },
      {
        icon: <LuCirclePlus />,
        label: "List a Property",
        href: "/onboarding/list-property",
      },
    ],
    extraInfo: {
      label: "Why upgrade?",
      content:
        "As an Agent you can list properties, manage leads, and unlock premium features. It's free to get started.",
    },
  },
  [Role.Agent]: {
    title: "Welcome, Agent!",
    description:
      "Manage your listings, connect with clients, and grow your portfolio.",
    steps: [
      {
        icon: <LuLayoutDashboard />,
        label: "Go to your Dashboard",
        href: "/dashboard",
      },
      {
        icon: <LuCirclePlus />,
        label: "Add a new property",
        href: "/list-property",
      },
      {
        icon: <LuMegaphone />,
        label: "Boost your listings",
        href: "/my-listings",
      },
      {
        icon: <LuUsers />,
        label: "Respond to inquiries",
        href: "/inquiries",
      },
      {
        icon: <LuTrendingUp />,
        label: "View market insights",
        href: "/academy",
      },
    ],
    extraInfo: {
      label: "Get verified",
      content:
        "Submit your verification documents in your profile. Verified agents rank higher in search results.",
    },
  },
  [Role.Company]: {
    title: "Welcome, Company!",
    description: "Manage your team, listings, and company brand at scale.",
    steps: [
      {
        icon: <LuLayoutDashboard />,
        label: "Company Dashboard",
        href: "/company/dashboard",
      },
      {
        icon: <LuUsers />,
        label: "Invite team members",
        href: "/company/team",
      },
      {
        icon: <LuBuilding2 />,
        label: "Complete verification",
        href: "/company/verification",
      },
      {
        icon: <LuMegaphone />,
        label: "Promote listings",
        href: "/company/listings",
      },
      {
        icon: <LuTrendingUp />,
        label: "Analytics & reports",
        href: "/company/analytics",
      },
    ],
  },
};

function formatRoleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getExtraInfo(
  activeRole: Role,
  user: PopulatedUser,
): { label: string; content: string } | null {
  if (activeRole === Role.Viewer) {
    return {
      label: "Why upgrade?",
      content:
        "As an Agent you can list properties, manage leads, and unlock premium features. It's free to get started.",
    };
  }

  if (activeRole === Role.Agent) {
    const status = user.agentProfile?.verificationStatus;

    if (status === "verified") {
      return {
        label: "Want AI Calling?",
        content:
          "AI Calling is exclusive to Partnership accounts. Register your company to unlock automatic follow-up calls on every enquiry.",
      };
    }

    if (status === "pending") {
      return {
        label: "Verification pending",
        content:
          "Your agent verification is under review. Verified agents rank higher in search results.",
      };
    }

    // unverified / rejected / undefined
    return {
      label: "Get verified",
      content:
        "Submit your verification documents in your profile. Verified agents rank higher in search results.",
    };
  }

  if (activeRole === Role.Company) {
    const company = user.companyId;
    const status = company?.verificationStatus;
    const hasAiCalling = company?.features?.tier === "pro";

    if (status !== "verified") {
      return {
        label:
          status === "pending"
            ? "Verification pending"
            : "Complete verification",
        content:
          status === "pending"
            ? "Your CAC verification is under review (2-5 business days). You can still configure your AI assistant in draft mode while you wait."
            : "Upload your CAC certificate and company documents to unlock Partnership features, including AI Calling on the Pro tier.",
      };
    }

    if (!hasAiCalling) {
      return {
        label: "Upgrade to Pro",
        content:
          "You're verified — upgrade to Pro to activate AI Calling and get automatic follow-up on every enquiry.",
      };
    }

    return {
      label: "AI Calling is live",
      content:
        "Your AI assistant is answering enquiries automatically. Check the Enquiries page to review call transcripts.",
    };
  }

  return null;
}

export default function WelcomePage() {
  const { user } = useAuth();

  if (!user) {
    return <PageSpinner label="loading user" />;
  }

  const activeRole = user.activeRole as Role;
  const guide = roleGuides[activeRole] ?? roleGuides[Role.Viewer];
  const extraInfo = getExtraInfo(activeRole, user);

  const initial = user.name?.charAt(0)?.toUpperCase() ?? "👤";

  return (
    <main className="min-h-screen bg-background py-10 md:py-14">
      <div className="mx-auto max-w-4xl px-4">
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl font-bold text-primary">{initial}</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {guide.title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm text-muted md:text-base">
            {guide.description}
          </p>

          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted">
            <RoleIcon role={activeRole} className="text-primary" />
            Signed in as{" "}
            <span className="capitalize text-foreground">{activeRole}</span>
          </span>
        </header>

        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Next steps
          </h2>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {guide.steps.map((step, i) => (
              <li key={i}>
                <StepCard step={step} />
              </li>
            ))}
          </ul>
        </section>

        {extraInfo && (
          <section className="mt-8">
            <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <span className="mt-0.5 shrink-0 text-primary">
                <LuInfo className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {extraInfo.label}
                </h3>
                <p className="mt-1 text-sm text-muted">{extraInfo.content}</p>
              </div>
            </div>
          </section>
        )}

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Go to Dashboard
              <BsArrowRight className="ml-2 inline-flex" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function StepCard({
  step,
  compact = false,
}: {
  step: Step;
  compact?: boolean;
}) {
  const inner = (
    <div
      className={
        compact
          ? "group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-border hover:bg-background"
          : "group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
      }
    >
      <span
        className={
          compact
            ? "flex h-6 w-6 shrink-0 items-center justify-center text-muted"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        }
      >
        {step.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={
            compact
              ? "truncate text-foreground"
              : "text-sm font-medium text-foreground"
          }
        >
          {step.label}
        </p>

        {!compact && step.href && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
            Get started
            <BsArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (!step.href) return inner;

  return (
    <Link href={step.href} className={compact ? "block" : "block h-full"}>
      {inner}
    </Link>
  );
}
