import { Button } from "@affilhomes/shared/ui";
import { Centered } from "@affilhomes/shared/ui/Centered";
import { LuLock } from "react-icons/lu";

export function SignInPrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Centered>
      <LuLock className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
      <p className="mb-6 text-subtle">{description}</p>
      <Button href="/login">Sign in</Button>
    </Centered>
  );
}
