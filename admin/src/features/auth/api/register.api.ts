import { signUpWithEmail } from "@affilhomes/shared/supabase";

import type { RegisterInput } from "../schemas/register.schema";
import { Role } from "@affilhomes/shared/types";

export type RegisterResult = {
  needsConfirm: boolean;
};

export async function requestAdminAccess(
  input: RegisterInput,
): Promise<RegisterResult> {
  const { session } = await signUpWithEmail(
    input.email,
    input.password,
    input.name,
    {
      requested_role: Role.Admin,
      admin_reason: input.reason,
    },
  );

  return { needsConfirm: !session };
}
