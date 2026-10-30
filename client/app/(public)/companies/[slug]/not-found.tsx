import { Button } from "@affilhomes/shared/ui/Button";
import { Centered } from "@affilhomes/shared/ui/Centered";

export default function CompanyNotFound() {
  return (
    <Centered
      // className="max-w-xl"
      subClassName="space-y-4"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Company not found
        </h1>
        <p className="text-sm text-muted">
          This company doesn&apos;t exist, may have been removed, or the link is
          incorrect.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button href="/companies" size="sm">
          Browse companies
        </Button>
        <Button href="/" size="sm" variant="outline">
          Go home
        </Button>
      </div>
    </Centered>
  );
}
