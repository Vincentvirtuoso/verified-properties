"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RiSendPlane2Line, RiCheckLine } from "react-icons/ri";
import { LuPhoneCall } from "react-icons/lu";

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
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
    >
      <div className="p-5">
        <div className="mb-4">
          <p className="text-sm font-bold text-foreground">Send Enquiry</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <LuPhoneCall className="h-3.5 w-3.5 text-primary shrink-0" />
            An assistant calls you back moments after you submit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+234 800 000 0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Message
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
            />
          </div>

          <motion.button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
              sent
                ? "bg-success text-success-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
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