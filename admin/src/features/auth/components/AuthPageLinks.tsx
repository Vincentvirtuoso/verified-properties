import Link from "next/link";

type AuthPage = "login" | "register" | "request-access";

export function AuthPageLinks({ current }: { current: AuthPage }) {
  if (current === "login") {
    return (
      <FooterText>
        New to the admin panel?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </Link>
      </FooterText>
    );
  }

  if (current === "register") {
    return (
      <FooterText>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </FooterText>
    );
  }

  return (
    <FooterText>
      Signed in with the wrong account? Use{" "}
      <span className="font-medium">Sign out</span> above.
    </FooterText>
  );
}

function FooterText({ children }: { children: React.ReactNode }) {
  return (
    <nav
      aria-label="Account links"
      className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground"
    >
      <p>{children}</p>
    </nav>
  );
}
