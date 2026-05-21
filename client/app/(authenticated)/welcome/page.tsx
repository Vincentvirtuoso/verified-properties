"use client";

import { Role } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import {
  LuHouse,
  LuUserCheck,
  LuBuilding,
  LuBuilding2,
  LuHammer,
  LuLayoutDashboard,
  LuListChecks,
  LuTrendingUp,
  LuMegaphone,
  LuFileText,
  LuUsers,
  LuSearch,
  LuStar,
  LuCirclePlus,
  LuSettings,
} from "react-icons/lu";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner, Spinner } from "@/components/ui/Spinner";
import { BsArrowRight } from "react-icons/bs";

interface RoleGuide {
  title: string;
  description: string;
  steps: { icon: React.ReactNode; label: string; href?: string }[];
  extraInfo?: { label: string; content: string }[];
}

const roleGuides: Record<Role, RoleGuide> = {
  [Role.Viewer]: {
    title: "Welcome, Explorer!",
    description:
      "You’re browsing as a viewer. Discover properties and start your journey in real estate.",
    steps: [
      {
        icon: <LuSearch />,
        label: "Browse JV opportunities",
        href: "/jv-properties",
      },
      {
        icon: <LuStar />,
        label: "Save your favourite listings",
        href: "/profile/favorites",
      },
      {
        icon: <LuUserCheck />,
        label: "Become an Agent / Landlord",
        href: "/onboarding/become-an-agent-or-landlord",
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
    extraInfo: [
      {
        label: "Why upgrade?",
        content:
          "As an Agent or Landlord you can list properties, manage leads, and unlock premium features. It’s free to get started.",
      },
    ],
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
        href: "/dashboard/listings",
      },
      {
        icon: <LuUsers />,
        label: "Respond to inquiries",
        href: "/dashboard/inquiries",
      },
      {
        icon: <LuTrendingUp />,
        label: "View market insights",
        href: "/academy",
      },
    ],
  },
  [Role.Landlord]: {
    title: "Welcome, Landlord!",
    description:
      "Showcase your properties and find the right tenants or JV partners.",
    steps: [
      {
        icon: <LuLayoutDashboard />,
        label: "Landlord Dashboard",
        href: "/dashboard",
      },
      {
        icon: <LuCirclePlus />,
        label: "List a property for sale/rent",
        href: "/list-property",
      },
      {
        icon: <LuFileText />,
        label: "Upload property documents",
        href: "/dashboard/documents",
      },
      {
        icon: <LuTrendingUp />,
        label: "Track performance",
        href: "/dashboard/analytics",
      },
      {
        icon: <LuUsers />,
        label: "View tenant inquiries",
        href: "/dashboard/inquiries",
      },
    ],
    extraInfo: [
      {
        label: "Joint Venture Ready?",
        content:
          "You can also publish JV opportunities directly from your dashboard. Check the JV section to start earning passive returns.",
      },
    ],
  },
  [Role.Developer]: {
    title: "Welcome, Developer!",
    description:
      "Access JV deals, manage projects, and find investors for your developments.",
    steps: [
      {
        icon: <LuBuilding />,
        label: "View JV Opportunities",
        href: "/jv-properties",
      },
      {
        icon: <LuHammer />,
        label: "Create a development project",
        href: "/projects/new",
      },
      {
        icon: <LuTrendingUp />,
        label: "Monitor investments",
        href: "/dashboard/investments",
      },
      { icon: <LuUsers />, label: "Connect with agents", href: "/network" },
      {
        icon: <LuSettings />,
        label: "Set up your developer profile",
        href: "/profile/settings",
      },
    ],
  },
  [Role.Company]: {
    title: "Welcome, Company!",
    description: "Manage your team, listings, and company brand at scale.",
    steps: [
      {
        icon: <LuLayoutDashboard />,
        label: "Company Dashboard",
        href: "/dashboard",
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

function Illustration({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center w-full h-32 bg-muted/20 rounded-2xl border border-muted/50">
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export default function WelcomePage() {
  const { user } = useAuth();

  if (!user) {
    return <PageSpinner label="loading user" />;
  }

  const activeRole = user.activeRole as Role;
  const guide = roleGuides[activeRole] ?? roleGuides[Role.Viewer];
  const allRoles = user.roles.length > 0 ? user.roles : [Role.Viewer];

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">
              {user.name?.charAt(0)?.toUpperCase() || "👤"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {guide.title}
          </h1>
          <p className="mt-2 text-muted max-w-xl mx-auto">
            {guide.description}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Illustration label="Welcome illustration" />
            <div className="mt-4 p-5 bg-card border border-border rounded-xl">
              <h3 className="font-semibold flex items-center gap-2">
                <LuListChecks className="h-4 w-4 text-primary" />
                Quick Start
              </h3>
              <ul className="mt-3 space-y-3">
                {guide.steps.slice(0, 3).map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 mt-0.5 text-muted">
                      {step.icon}
                    </span>
                    {step.href ? (
                      <Link
                        href={step.href}
                        className="hover:text-primary transition-colors"
                      >
                        {step.label}
                      </Link>
                    ) : (
                      <span>{step.label}</span>
                    )}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                asChild
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold">
                Your role{allRoles.length > 1 ? "s" : ""}
              </h2>
              <p className="text-sm text-muted mt-1">
                You’re currently using the{" "}
                <strong className="capitalize">{activeRole}</strong> profile.
              </p>

              <Accordion className="mt-4">
                {allRoles.map((role) => {
                  const roleGuide = roleGuides[role] ?? roleGuides[Role.Viewer];
                  return (
                    <AccordionItem key={role} value={role}>
                      <AccordionTrigger icon={getRoleIcon(role)}>
                        {role.charAt(0).toUpperCase() + role.slice(1)} Guide
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p className="text-sm text-muted">
                            {roleGuide.description}
                          </p>
                          <ul className="space-y-3">
                            {roleGuide.steps.map((step, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-3 text-sm"
                              >
                                <span className="text-muted">{step.icon}</span>
                                {step.href ? (
                                  <Link
                                    href={step.href}
                                    className="hover:text-primary transition-colors"
                                  >
                                    {step.label}
                                  </Link>
                                ) : (
                                  <span>{step.label}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                          {roleGuide.extraInfo?.map((info, i) => (
                            <div
                              key={i}
                              className="mt-4 p-3 bg-muted/20 rounded-lg"
                            >
                              <h4 className="font-medium text-sm">
                                {info.label}
                              </h4>
                              <p className="text-xs text-muted mt-1">
                                {info.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {guide.steps.slice(0, 4).map((step, i) => (
                <div
                  key={i}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors duration-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{step.label}</p>
                      {step.href && (
                        <Link
                          href={step.href}
                          className="text-xs text-primary hover:underline"
                        >
                          Get started{" "}
                          <BsArrowRight className="inline-flex ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function getRoleIcon(role: Role) {
  switch (role) {
    case Role.Viewer:
      return <LuSearch className="h-4 w-4" />;
    case Role.Agent:
      return <LuUserCheck className="h-4 w-4" />;
    case Role.Landlord:
      return <LuHouse className="h-4 w-4" />;
    case Role.Developer:
      return <LuHammer className="h-4 w-4" />;
    case Role.Company:
      return <LuBuilding className="h-4 w-4" />;
    default:
      return <LuStar className="h-4 w-4" />;
  }
}
