export type JvPlanId = "weekly" | "monthly" | "yearly";

export interface JvPlan {
  id: JvPlanId;
  name: string;
  priceNaira: number;
  durationDays: number;
  features: string[];
  popular?: boolean;
}

export const JV_PLANS: JvPlan[] = [
  {
    id: "weekly",
    name: "Weekly",
    priceNaira: 10_000,
    durationDays: 7,
    features: [
      "7 days of access to JV requests",
      "Browse and respond to open requests",
      "Email support",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    priceNaira: 40_000,
    durationDays: 30,
    popular: true,
    features: [
      "30 days of access to JV requests",
      "Browse and respond to open requests",
      "Everything in Weekly",
      "Priority email and chat support",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    priceNaira: 440_000,
    durationDays: 365,
    features: [
      "365 days of access to JV requests",
      "Browse and respond to open requests",
      "Everything in Monthly",
      "Dedicated account manager",
    ],
  },
];

export const isJvPlanId = (value: string | null): value is JvPlanId =>
  value === "weekly" || value === "monthly" || value === "yearly";
