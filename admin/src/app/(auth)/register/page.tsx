import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata = { title: "Request admin access" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          A
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Request admin access
        </h1>
        <p className="text-sm text-muted">
          Your request will be reviewed before activation.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
