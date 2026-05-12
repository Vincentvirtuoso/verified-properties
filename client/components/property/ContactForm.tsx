"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RiSendPlane2Line, RiCheckLine } from "react-icons/ri";

interface ContactFormProps {
  propertyTitle: string;
}

export default function ContactForm({ propertyTitle }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: `Hi, I'm interested in "${propertyTitle}". Please contact me.`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submit
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <motion.div
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
    >
      <div className="p-5">
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Send Enquiry
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+234 800 000 0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Message
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          <motion.button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
              sent
                ? "bg-emerald-600 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {sent ? (
              <>
                <RiCheckLine size={16} />
                Message Sent!
              </>
            ) : (
              <>
                <RiSendPlane2Line size={16} />
                Send Message
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
