import { NextResponse } from "next/server";
import { createClientFromServer } from "@affilhomes/shared/supabase/server";
import {
  normaliseNgNumber,
  mockProvider,
} from "@/server/services/aiCallNumbers";

type OwnerType = "company" | "agent";

type Body = {
  ownerType: OwnerType;
  ownerId?: string;
  /** Legacy field from the company page. Remove once every caller sends ownerId. */
  companyId?: string;
  number: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DB_ERRORS: Record<string, { status: number; message: string }> = {
  no_active_ai_subscription: {
    status: 402,
    message: "You need an active AI calling plan before adding a number.",
  },
  number_cap_reached: {
    status: 409,
    message: "Your plan has reached its number limit.",
  },
  not_authorised: {
    status: 403,
    message: "You don't have permission to do that.",
  },
  numbers_not_in_trial: {
    status: 402,
    message: "Phone numbers are available once you choose a paid plan.",
  },
};

export async function POST(req: Request) {
  const supabase = await createClientFromServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.ownerType !== "company" && body.ownerType !== "agent") {
    return NextResponse.json({ error: "Invalid owner." }, { status: 400 });
  }

  const requestedOwner = body.ownerId ?? body.companyId;
  let ownerId: string;

  if (body.ownerType === "agent") {
    if (requestedOwner && requestedOwner !== user.id) {
      return NextResponse.json(
        { error: "You can only manage your own numbers." },
        { status: 403 },
      );
    }
    ownerId = user.id;
  } else {
    if (!requestedOwner || !UUID.test(requestedOwner)) {
      return NextResponse.json({ error: "Missing company." }, { status: 400 });
    }
    ownerId = requestedOwner;
  }

  const { data: allowed, error: permError } = await supabase.rpc(
    "can_manage_ai_billing",
    { p_owner_type: body.ownerType, p_owner_id: ownerId },
  );
  if (permError) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "You don't have permission to manage AI calling for this account.",
      },
      { status: 403 },
    );
  }

  let e164: string;
  try {
    e164 = normaliseNgNumber(body.number ?? "");
  } catch {
    return NextResponse.json(
      { error: "Enter a valid Nigerian number, for example 0803 123 4567." },
      { status: 400 },
    );
  }

  const { carrier } = mockProvider.describe(e164);

  const { data, error } = await supabase.rpc("request_ai_call_number", {
    p_owner_type: body.ownerType,
    p_owner_id: ownerId,
    p_e164: e164,
    p_carrier: carrier,
  });

  if (error) {
    const known = DB_ERRORS[error.message?.trim() ?? ""];
    if (known) {
      return NextResponse.json(
        { error: known.message },
        { status: known.status },
      );
    }
    if (error.code === "42501") {
      return NextResponse.json(
        { error: "You don't have permission to do that." },
        { status: 403 },
      );
    }

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That number is already in use." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { id: data, e164, ownerType: body.ownerType, status: "pending" },
    { status: 201 },
  );
}
