"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { createEnquiry } from "@/lib/supabase/enquiries";
import { motion } from "framer-motion";
import { RiSendPlane2Line, RiCheckLine } from "react-icons/ri";
import { LuPhoneCall } from "react-icons/lu";

interface ContactFormProps {
  propertyId: string;
  propertyTitle: string;
  /** Listing owner; owners can't enquire on their own listing. */
  ownerId?: string;
}

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Please enter a valid phone number"),
  message: z.string().trim().min(1, "Please enter a message").max(2000, "Message is too long"),
});

export default function ContactForm({ propertyId, propertyTitle, ownerId }: ContactFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string | null; phone: string | null; message: string }>({
    // null = not edited yet, so the signed-in user's profile is used.
    name: null,
    phone: null,
    message: `Hi, I'm interested in "${propertyTitle}". Please contact me.`,
  });

  const values = {
    name: form.name ?? user?.name ?? "",
    phone: form.phone ?? user?.phone ?? "",
    message: form.message,
  };

  const isOwnListing = !!user && !!ownerId && user._id === ownerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    try {
      await createEnquiry({ propertyId, ...parsed.data });
      setSent(true);
    } catch {
      setError("We couldn't send your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

        {isOwnListing ? (
          <p className="text-sm text-muted-foreground">This is your listing.</p>
        ) : sent ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <RiCheckLine className="h-4 w-4 text-success" /> Enquiry sent
            </p>
            <p className="text-muted-foreground">
              The agent has your message and number. You can follow the conversation in your enquiries.
            </p>
            <Link href="/enquiries" className="inline-block font-semibold text-primary hover:underline">
              View my enquiries
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              required
              value={values.name}
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
              value={values.phone}
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
              maxLength={2000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          <motion.button
            type="submit"
            disabled={submitting}
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
                {submitting ? "Sending…" : user ? "Send Message" : "Sign in to send"}
              </>
            )}
          </motion.button>
        </form>
        )}
      </div>
    </motion.div>
  );
}