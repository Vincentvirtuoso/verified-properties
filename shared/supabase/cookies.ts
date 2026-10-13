export const cookieOptions = {
  domain: process.env.NODE_ENV === "production" ? ".affilhomes.com" : undefined,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
