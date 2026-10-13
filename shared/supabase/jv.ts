"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { JVProperty } from "../types";

/**
 * Public JV listings. RLS only returns status = 'active' rows to visitors,
 * and a JV listing becomes active only after an admin approves it (013).
 */

const JV_SELECT = "*, jv_property_images(url, alt, sort_order)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapJVRow(r: any): JVProperty {
  const gallery = [...(r.jv_property_images ?? [])]
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((g: any) => ({ url: g.url, alt: g.alt ?? r.title }));
  return {
    _id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? undefined,
    location: {
      address: r.address,
      city: r.city,
      state: r.state,
      country: r.country,
      coordinates: r.latitude != null && r.longitude != null ? { lat: r.latitude, lng: r.longitude } : undefined,
    },
    image: r.image ?? gallery[0]?.url,
    gallery,
    price: Number(r.price ?? 0),
    currency: r.currency ?? "NGN",
    landValue: r.land_value == null ? undefined : Number(r.land_value),
    landSize: r.land_size ?? undefined,
    premium: r.premium == null ? undefined : Number(r.premium),
    minimumInvestment: Number(r.minimum_investment ?? 0),
    roi: Number(r.roi ?? 0),
    investmentDuration: r.investment_duration,
    sharingFormula: r.sharing_formula ?? undefined,
    facilitatorFee: r.facilitator_fee ?? undefined,
    category: r.category ?? undefined,
    type: r.property_type ?? undefined,
    purposeDescription: r.purpose_description ?? undefined,
    googlePin: r.google_pin ?? undefined,
    totalInvestors: r.total_investors ?? 0,
    maxInvestors: r.max_investors ?? undefined,
    status: r.status,
    propertyId: r.property_id ?? undefined,
    ownerId: r.owner_id,
    ownerType: r.owner_type,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  } as JVProperty;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchActiveJV(limit?: number, client?: SupabaseClient): Promise<JVProperty[]> {
  let q = (client ?? createClient())
    .from("jv_properties")
    .select(JV_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapJVRow);
}

export async function fetchJVBySlug(slug: string, client?: SupabaseClient): Promise<JVProperty | null> {
  const { data, error } = await (client ?? createClient())
    .from("jv_properties")
    .select(JV_SELECT)
    .eq("status", "active")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJVRow(data) : null;
}

/** Loads live JV listings for client pages. `null` while loading. */
export function useActiveJV(limit?: number) {
  const [items, setItems] = useState<JVProperty[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchActiveJV(limit)
      .then((r) => !cancelled && setItems(r))
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);
  return { items, error };
}
