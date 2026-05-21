import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold">Start Your Learning Journey</h2>
        <p className="mt-3 text-primary-foreground/80">
          Join thousands of real estate professionals and investors already
          upskilling with our expert-led courses.
        </p>
        <Button size="lg" variant="secondary" className="mt-6" asChild>
          <Link href="/academy/courses">Explore Courses</Link>
        </Button>
      </div>
    </section>
  );
}
