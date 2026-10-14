import { isProduction } from "../utils";

const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

export const cookieOptions = {
  domain: cookieDomain,
  path: "/",
  sameSite: "lax" as const,
  secure: isProduction(),
};
