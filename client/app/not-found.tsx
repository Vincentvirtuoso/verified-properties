import { Button } from "@/components/ui/Button";
import { LuHouse, LuCircleHelp } from "react-icons/lu";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="relative">
          <div className="text-9xl font-bold text-subtle">404</div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-4">
          Page not found
        </h1>
        <p className="text-muted mt-2">
          Sorry, we couldn’t find the page you’re looking for. It might have
          been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button asChild variant="secondary" href="/">
            <LuHouse className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          <Button asChild variant="outline" href="/support">
            <LuCircleHelp className="mr-2 h-4 w-4" />
            Visit Support
          </Button>
        </div>
      </div>
    </div>
  );
}
