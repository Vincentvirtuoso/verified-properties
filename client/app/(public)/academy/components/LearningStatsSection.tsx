"use client";
import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

function Counter({
  from,
  to,
  duration,
}: {
  from: number;
  to: number;
  duration: number;
}) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, [count, to, duration]);

  return <motion.span>{rounded}</motion.span>;
}

export default function LearningStatsSection() {
  const stats = [
    { label: "Total Courses", value: 128, suffix: "" },
    { label: "Hours of Content", value: 742, suffix: "h" },
    { label: "Active Students", value: 2350, suffix: "+" },
    { label: "Podcasts Published", value: 56, suffix: "" },
  ];

  return (
    <section className="bg-muted/10 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary">
                <Counter from={0} to={stat.value} duration={2.5} />
                {stat.suffix}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
