import { properties } from "@/data/properties";
import { PopulatedProperty, Stats, Testimonial } from "@/types";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchFeaturedProperties(): Promise<PopulatedProperty[]> {
  await delay(800);
  return properties.filter((p) => p.tier === "featured");
}

export async function fetchStats(): Promise<Stats> {
  await delay(600);
  return {
    totalProperties: properties.length,
    cities: new Set(properties.map((p) => p.location.address.split(",")[0]))
      .size,
    happyClients: 1200,
    owners: new Set(properties.map((p) => p.ownerId)).size,
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
