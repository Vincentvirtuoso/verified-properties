"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { LuBookOpen, LuHeadphones } from "react-icons/lu";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-linear-to-br from-primary/10 via-background to-background">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold tracking-tight"
        >
          Master Real Estate &<br />
          <span className="text-primary">Joint Venture Investing</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Learn from industry experts. Structured courses, podcasts, and
          real‑world case studies to help you build wealth through property.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <Link href="/academy/courses">
            <Button size="lg" asChild>
              <LuBookOpen className="mr-2 h-5 w-5" />
              Browse Courses
            </Button>
          </Link>
          <Link href="#podcasts">
            <Button size="lg" variant="outline" asChild>
              <LuHeadphones className="mr-2 h-5 w-5" />
              Listen to Podcasts
            </Button>
          </Link>
        </motion.div>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-200 h-200 bg-primary/20 rounded-full blur-3xl opacity-30" />
    </section>
  );
}
