import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  const { data: ids, error: claimError } = await admin.rpc(
    "claim_due_account_deletions",
    {
      p_limit: 25,
    },
  );
  if (claimError) {
    console.error("claim failed", claimError);
    return new Response("claim_failed", { status: 500 });
  }

  const results = { completed: 0, failed: 0 };

  for (const userId of (ids ?? []) as string[]) {
    try {
      const { error: anonError } = await admin.rpc("anonymise_account", {
        p_user_id: userId,
      });
      if (anonError) throw anonError;

      // Soft delete: disables sign-in and keeps the auth row so references stay valid.
      const { error: authError } = await admin.auth.admin.deleteUser(
        userId,
        true,
      );
      if (authError) throw authError;

      const { error: doneError } = await admin.rpc(
        "complete_account_deletion",
        {
          p_user_id: userId,
        },
      );
      if (doneError) throw doneError;

      results.completed++;
    } catch (e) {
      // Left in "processing"; reclaimed on a later run.
      console.error("purge failed for", userId, e);
      results.failed++;
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
