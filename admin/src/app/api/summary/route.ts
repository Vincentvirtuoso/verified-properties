import { NextResponse } from "next/server";
import { createClientFromServer as createClient } from "@affilhomes/shared/supabase/server";

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

async function safeCount(
  label: string,
  query: PromiseLike<CountResult>,
): Promise<number | null> {
  const { count, error } = await query;
  if (error) {
    console.error(`[dashboard/summary] ${label}:`, error.message);
    return null;
  }
  return count ?? 0;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const role = profile.active_role as "viewer" | "agent" | "company";
  const ownsListings = role === "agent" || role === "company";
  const enquiryColumn = role === "agent" ? "agent_id" : "viewer_id";

  const [
    enquiriesCount,
    savedPropertiesCount,
    listingsCount,
    draftListingsCount,
  ] = await Promise.all([
    role === "company"
      ? null
      : safeCount(
          "enquiries",
          supabase
            .from("inquiries")
            .select("id", { count: "exact", head: true })
            .eq(enquiryColumn, user.id),
        ),
    safeCount(
      "saved",
      supabase
        .from("saved_properties")
        .select("property_id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ),
    ownsListings
      ? safeCount(
          "listings",
          supabase
            .from("properties")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("status", "active"),
        )
      : null,
    ownsListings
      ? safeCount(
          "drafts",
          supabase
            .from("properties")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("status", "draft"),
        )
      : null,
  ]);

  const summary = {
    enquiriesCount,
    savedPropertiesCount,
    listingsCount,
    draftListingsCount,
    teamMembersCount: null,
    openRolesCount: null,
    jvThreadsUnread: null,
    analyticsIsNew: null,
  };

  return NextResponse.json(summary, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
