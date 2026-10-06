import {
  fetchActiveProperties,
  fetchPublicStats,
} from "@/lib/supabase/publicProperties";
import { PopulatedProperty, Stats, Testimonial } from "@/types";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchFeaturedProperties(): Promise<PopulatedProperty[]> {
  return fetchActiveProperties({ tier: "featured", limit: 8 });
}

export async function fetchStats(): Promise<Stats> {
  const live = await fetchPublicStats();
  return {
    totalProperties: live.totalProperties,
    cities: live.cities,
    // Marketing figure, not tracked in the database yet.
    happyClients: 1200,
    owners: live.owners,
  };
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  await delay(700);
  return [
    {
      id: "1",
      author: "Chidi Okonkwo",
      role: "Homeowner",
      text: "Found my dream home in less than a week!",
      rating: 5,
    },
    {
      id: "2",
      author: "Fatima Ibrahim",
      role: "Investor",
      text: "The verified agents made the process seamless.",
      rating: 5,
    },
    {
      id: "3",
      author: "Emeka Nwosu",
      role: "Tenant",
      text: "Best rental experience ever. Highly recommended.",
      rating: 4,
    },
  ];
}
