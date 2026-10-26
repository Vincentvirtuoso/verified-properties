import { createAdminBrowserClient } from "@/lib/supabase";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResult = {
  needsConfirm: boolean;
};

export async function signUpForAdmin(
  input: RegisterInput,
): Promise<RegisterResult> {
  const supabase = createAdminBrowserClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
      },
    },
  });

  if (error) {
    throw new Error(
      error.message ||
        "We couldn't create your account. Check your details and try again.",
    );
  }

  return { needsConfirm: !data.session };
}
