function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-border ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-foreground/5 to-transparent" />
    </div>
  );
}

function FormFieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

function BannerSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

function UploadSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-36" />
      <Skeleton className={`w-full rounded-lg ${tall ? "h-24" : "h-16"}`} />
    </div>
  );
}

export function AuthFormSkeleton({ variant }: { variant?: "agent" | "company" }) {
  const isCompany = variant === "company";
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl bg-card text-card-foreground rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="h-7 w-2/3 mx-auto" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
        </div>

        <BannerSkeleton />

        {isCompany ? (
          <>
            <UploadSkeleton />
            <UploadSkeleton tall />
            <FormFieldSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </>
        ) : (
          <>
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </>
        )}

        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}