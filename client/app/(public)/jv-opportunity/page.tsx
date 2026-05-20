"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuCheck, LuClock, LuBuilding2, LuArrowRight } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { imageLoader } from "@/utils/helpers";
import { MOCK_JV_PROPERTIES } from "@/data/mock-jv-properties";

const PLANS = [
  {
    name: "Weekly",
    price: "₦ 10,000",
    duration: "week",
    period: "weekly",
    icon: LuClock,
    features: [
      "Access to 5 JV listings",
      "Basic property details",
      "Email support",
      "Weekly digest",
    ],
    popular: false,
  },
  {
    name: "Monthly",
    price: "₦ 40,000",
    duration: "month",
    period: "monthly",
    icon: LuBuilding2,
    features: [
      "Access to all JV listings",
      "Detailed analytics",
      "Priority email & chat support",
      "Monthly market report",
      "Direct contact with partners",
    ],
    popular: true,
  },
  {
    name: "Yearly",
    price: "₦ 440,000",
    duration: "year",
    period: "yearly",
    icon: LuCheck,
    features: [
      "Everything in Monthly",
      "Early access to new deals",
      "Dedicated account manager",
      "Quarterly strategy calls",
      "Co‑branded marketing materials",
    ],
    popular: false,
  },
];

export default function JvOpportunityPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");

  return (
    <main className="min-h-screen">
      <section className="bg-primary py-16 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
          Joint Venture Opportunities
        </h1>
        <p className="text-lg max-w-2xl mx-auto opacity-90">
          Partner with verified developers and earn attractive returns on real
          estate projects across Nigeria. Choose a plan that fits your
          investment style.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold">
            Choose Your Access Plan
          </h2>
          <p className="mt-3 text-subtle max-w-3xl mx-auto">
            Unlock exclusive joint venture listings and tools. Cancel or upgrade
            anytime.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isActive = selectedPlan === plan.period;

            return (
              <div
                key={plan.period}
                onClick={() => setSelectedPlan(plan.period)}
                className={`relative flex flex-col p-8 bg-card rounded-2xl border-2 cursor-pointer transition-all duration-300
                  ${isActive ? "border-purple-500 shadow-xl scale-[1.02]" : "border-border hover:border-purple-500/50 hover:shadow-lg"}
                  ${plan.popular ? "md:-mt-4 md:mb-4" : ""}
                `}
              >
                {plan.popular && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-xs font-bold px-4 py-1 rounded-full text-white">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${isActive ? "bg-primary/10 text-primary" : "bg-inverse text-muted"}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-muted">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-subtle">Billed {plan.period}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-muted">
                    {plan.price}
                  </span>
                  <span className="text-subtle ml-2">/{plan.duration}</span>
                </div>

                <ul className="space-y-3 mb-8 grow">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-subtle"
                    >
                      <LuCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant={isActive ? "primary" : "outline"}>
                  <Link href={`/subscribe?plan=${plan.period}`}>
                    Subscribe {plan.name}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold">
              Explore Active JV Opportunities
            </h2>
            <p className="mt-2 text-muted max-w-3xl">
              Browse hand‑picked joint venture projects currently open for
              investment.
            </p>
          </div>
          <Link
            href="/jv-properties"
            className="hidden md:flex items-center gap-1 text-primary font-semibold hover:underline"
          >
            View all <LuArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_JV_PROPERTIES.map((property) => (
            <Link
              key={property._id}
              href={`/jv-properties/${property.slug}`}
              className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={"/placeholder-property.png"}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loader={imageLoader}
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute top-3 left-3 bg-inverse/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-primary">
                  ROI {property.roi}%
                </div>
                {property.landSize && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {property.landSize}
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                  {property.title}
                </h3>
                <p className="text-sm text-muted mb-2">
                  {property.location.city}, {property.location.state}
                </p>

                <div className="flex items-center gap-2 mb-3 text-xs text-muted flex-wrap whitespace-nowrap">
                  {property.sharingFormula && (
                    <span className="bg-muted/20 px-2 py-0.5 rounded">
                      {property.sharingFormula}
                    </span>
                  )}
                  {property.facilitatorFee && (
                    <span className="bg-muted/20 px-2 py-0.5 rounded">
                      Fee {property.facilitatorFee.totalPercentage}%
                    </span>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">
                      {property.landValue
                        ? `₦${property.landValue.toLocaleString()}`
                        : `₦${property.minimumInvestment.toLocaleString()} min`}
                    </span>
                    <span className="text-muted">
                      {property.investmentDuration}
                    </span>
                  </div>
                  {property.totalInvestors !== undefined && (
                    <div className="mt-2 text-xs text-muted">
                      {property.totalInvestors}/{property.maxInvestors ?? "∞"}{" "}
                      investors
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/jv-properties">View All Properties</Link>
          </Button>
        </div>
      </section>

      <section className="bg-foreground/20 mb-10 py-10 px-4 text-center">
        <h2 className="text-2xl text-muted md:text-3xl font-bold mb-3">
          Ready to Partner?
        </h2>
        <p className="text-subtle max-w-2xl mx-auto mb-6">
          Join hundreds of smart investors growing wealth through real estate
          joint ventures.
        </p>
        <Button size="lg">
          <Link href="/register">Get Started Now</Link>
        </Button>
      </section>
    </main>
  );
}
