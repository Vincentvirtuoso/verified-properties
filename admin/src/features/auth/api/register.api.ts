import { createAdminBrowserClient } from "@/lib/supabase";
import type { RegisterInput } from "../schemas/register.schema";

export type RegisterResult = {
  needsConfirm: boolean;
};

export async function requestAdminAccess(
  input: RegisterInput,
): Promise<RegisterResult> {
  const supabase = createAdminBrowserClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
        access_request: "admin",
        admin_reason: input.reason.trim().slice(0, 1000),
      },
    },
  });

  if (error) {
    const message: string =
      error.message ??
      "We couldn't submit your request. Check your details and try again.";
    throw new Error(message);
  }

  return { needsConfirm: !data.session };
}
