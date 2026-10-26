import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(120),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
