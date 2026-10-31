import { normalizeNigerianPhone } from "../utils";
import { createClient } from "./client";

export async function requestEmailVerification(): Promise<void> {
  const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) throw new Error("Not signed in");

  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
}

export async function requestPhoneVerification(phone: string): Promise<void> {
  const normalized = normalizeNigerianPhone(phone);
  if (!normalized) throw new Error("Enter a Nigerian number (+234).");

  const supabase = createClient();
  const { error } = await supabase.functions.invoke(
    "request-phone-verification",
    { body: { phone: normalized } },
  );
  if (error) throw error;
}

export async function confirmPhoneVerification(
  phone: string,
  code: string,
): Promise<void> {
  const normalized = normalizeNigerianPhone(phone);
  if (!normalized) throw new Error("Enter a Nigerian number (+234).");

  const supabase = createClient();
  const { error } = await supabase.functions.invoke(
    "confirm-phone-verification",
    { body: { phone: normalized, code } },
  );
  if (error) throw error;
}
