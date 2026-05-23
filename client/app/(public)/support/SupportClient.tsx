"use client";

import { useState } from "react";
import {
  FaWhatsapp,
  FaEnvelope,
  FaPhoneAlt,
  FaRegPaperPlane,
} from "react-icons/fa";
import { FiUser, FiMail, FiHelpCircle } from "react-icons/fi";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How do I list a property?",
    answer:
      "Once you're logged in as an Agent (realtor/landlord), click 'List a Property' from your dashboard, fill in the property details, upload images, and publish. Your listing will appear after verification.",
  },
  {
    question: "What is a Boost and how does it work?",
    answer:
      "Boosting moves your standard listing closer to the featured tier. It costs ₦1,000 per property per 30 days. You can boost any active listing from the 'My Listings' page.",
  },
  {
    question: "How do I verify my agent profile?",
    answer:
      "Go to your Profile → Verification tab. Upload the required documents (profile picture, government ID, professional certificate, utility bill). Our team reviews within 2–3 business days.",
  },
  {
    question: "Can I switch between Viewer, Agent, and Company roles?",
    answer:
      "Yes – you can switch between any roles you've onboarded. Viewer is default, Agent requires agent package, Company requires partnership package. Company role is locked and cannot be combined with others.",
  },
  {
    question: "How do I register a Company?",
    answer:
      "From the User Menu in navbar, choose 'Register Company'. You'll need to provide CAC certificate, company logo, proof of address, and contact details. After verification, you get a featured tier and team management.",
  },
  {
    question: "What is the difference between featured and standard tier?",
    answer:
      "Featured tier (Company listings) appear at the top of search results. Standard tier (Agent listings) appear below, but can be boosted to get closer to featured placement.",
  },
];

const contactChannels = [
  {
    label: "WhatsApp",
    href: "https://wa.me/2348000000000",
    icon: FaWhatsapp,
    color: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  {
    label: "Email Us",
    href: "mailto:support@yourdomain.com",
    icon: FaEnvelope,
    color: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    label: "Call Center",
    href: "tel:+2348000000000",
    icon: FaPhoneAlt,
    color: "bg-muted/30 text-muted hover:bg-muted/50",
  },
];

export default function SupportClient() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return regex.test(email);
  };

  const handleInputChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Please provide your full name.";
    if (!form.email.trim()) {
      newErrors.email = "A valid contact email address is required.";
    } else if (!validateEmail(form.email)) {
      newErrors.email =
        "Please enter a valid email address (e.g., name@example.com).";
    }
    if (!form.message.trim()) {
      newErrors.message = "Please write a brief description of the issue.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Simulate API call – replace with actual fetch
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random failure (optional)
          if (Math.random() < 0.1) reject(new Error("Network error"));
          else resolve(true);
        }, 1500);
      });
      alert(
        "Support request sent successfully! Our team will respond shortly.",
      );
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      alert("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground ">
      {/* Hero Section */}
      <section className="relative border-b border-border bg-linear-to-b from-muted/30 to-background py-10 lg:py-0">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7 xl:col-span-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Our Customer Support
              </h1>

              <p className="max-w-xl text-lg text-muted leading-relaxed">
                Have questions about listing parameters, agent profile
                verification, or billing packages? Reach out below or explore
                our frequently asked community questions.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  href="#message-section"
                  className="text-sm px-6 font-semibold py-2 rounded-lg flex-1"
                >
                  Send us a Message
                </Button>

                <div className="flex items-center gap-2">
                  {contactChannels.map((channel) => {
                    const ChannelIcon = channel.icon;
                    return (
                      <Link
                        key={channel.label}
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                          channel.color,
                        )}
                        title={channel.label}
                      >
                        <ChannelIcon size={16} />
                        <span className="hidden md:inline">
                          {channel.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="hidden lg:col-span-5 lg:block xl:col-span-6">
              <div className="relative w-full h-full min-h-120">
                <Image
                  src="/illustrations/support_illustration.png"
                  className="object-contain h-150 w-150"
                  alt="Support illustration"
                  fill
                  sizes="(max-width: 1024px) 90vw, 60vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:items-start">
          {/* Contact Form */}
          <section id="message-section" className="scroll-mt-24 lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  Open a Support Ticket
                </h2>
                <p className="text-sm text-muted">
                  Fill in details below and our team will respond via email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  label="Full Name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  icon={FiUser}
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  error={errors.name}
                  required
                />

                <Field
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  icon={FiMail}
                  value={form.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={errors.email}
                  required
                />

                <Field
                  label="Subject (Optional)"
                  name="subject"
                  type="text"
                  placeholder="e.g., Profile Verification Delay"
                  value={form.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                />

                <Textarea
                  label="How can we help you?"
                  name="message"
                  placeholder="Provide as much background detail here as possible..."
                  value={form.message}
                  onChange={(val) => handleInputChange("message", val)}
                  error={errors.message}
                  maxLength={1000}
                  required
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2"
                  leftIcon={
                    <FaRegPaperPlane
                      size={14}
                      className={cn(isSubmitting && "animate-pulse")}
                    />
                  }
                >
                  {isSubmitting ? "Submitting Request..." : "Submit Ticket"}
                </Button>
              </form>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="lg:col-span-7">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FiHelpCircle className="text-primary shrink-0" size={22} />
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-muted">
                Review solutions to common tasks before contacting support.
              </p>
            </div>

            <Accordion>
              {faqs.map((item, index) => (
                <AccordionItem key={index} value={`faq-item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted leading-relaxed">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>
    </div>
  );
}
