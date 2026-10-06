import { createClient } from "@/lib/supabase/client";

export async function signInWithEmail(
  email: string,
  password: string,
) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export interface SignUpExtras {
  phone?: string;
  whatsappNumber?: string;
  /** Path to land on after the email confirmation link is clicked. */
  next?: string;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string,
  extras: SignUpExtras = {},
) {
  const supabase = createClient();

  const next = extras.next ?? "/dashboard";

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      // Read by the handle_new_user() trigger to fill the profile row.
      data: {
        name: name ?? "",
        phone: extras.phone ?? "",
        whatsapp_number: extras.whatsappNumber ?? extras.phone ?? "",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    throw error;
  }
}

export async function updatePassword(password: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}

/**
 * Returns the signed-in auth user. Uses getUser(), which re-validates
 * the session with Supabase Auth instead of trusting local storage.
 */
export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // "Auth session missing" simply means signed out.
    if (error.name === "AuthSessionMissingError") return null;
    throw error;
  }

  return user ?? null;
}

export async function getCurrentProfile() {
  const supabase = createClient();

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates the caller's profile. Privileged columns (email, verification
 * flags, company link, company role, agent verification) are enforced
 * server-side by the guard_profile_update() trigger.
 */
export async function updateCurrentProfile(
  userId: string,
  updates: Record<string, unknown>,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
