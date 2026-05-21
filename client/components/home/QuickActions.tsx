import React from "react";
import { motion } from "framer-motion";
import { FaWhatsapp, FaPodcast, FaArrowRight, FaShield } from "react-icons/fa6";
import { IconType } from "react-icons";
import Link from "next/link";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { FaHandshake } from "react-icons/fa";

const ActionLink = ({
  title,
  desc,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  desc: string;
  icon: IconType;
  color: string;
  href: string;
}) => (
  <motion.a
    href={href}
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group flex items-start gap-4 py-4 border-b border-border/50 last:border-0 hover:bg-inverse transition-all rounded-lg px-2"
  >
    <div
      className={`mt-1 p-2 rounded-xl ${color} text-white shadow-md shadow-current/10`}
    >
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <FaArrowRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary text-sm" />
      </div>
      <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
        {desc}
      </p>
    </div>
  </motion.a>
);

const QuickActions = () => {
  const { bannerHeight } = useBannerHeightContext();

  return (
    <section className="w-full bg-background pt-10 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight mb-2">
                Essential Tools
              </h2>
              <p className="text-muted-foreground text-sm">
                Everything you need to navigate the market safely.
              </p>
            </div>

            <div className="flex flex-col">
              <ActionLink
                title="WhatsApp Search"
                desc="Chat with our AI bot to find listings and verify prices without leaving WhatsApp."
                icon={FaWhatsapp}
                color="bg-[#25D366]"
                href="https://wa.me/+2347063935401"
              />
              <ActionLink
                title="Developer’s Pro Joint Ventures"
                desc="Partner with us on high-yield residential projects. Exclusive joint venture access for scale-ready developers."
                icon={FaHandshake}
                color="bg-emerald-700"
                href="/jv-opportunity"
              />
              <ActionLink
                title="Real Estate Podcast"
                desc="Weekly insights from legal experts and pro investors on the 'Learn & Grow' show."
                icon={FaPodcast}
                color="bg-purple-600"
                href="/academy/podcasts"
              />
            </div>
          </div>

          {/* RIGHT: Trust Mission (Sticky) */}
          <div className="lg:col-span-5 h-full">
            <div
              className="sticky"
              style={{ top: `calc(${bannerHeight + 96}px)` }}
            >
              <div className="relative p-6 rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <FaShield size={32} className="text-primary mb-4" />
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">
                    Fighting Scam Culture
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Tired of shadow agents and fake listings? Our verification
                    engine ensures every property on our platform is 100%
                    legitimate.
                  </p>
                  <Link
                    href="/about"
                    className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                  >
                    Our Safety Protocol <FaArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickActions;
