import { Company, PopulatedProperty, PopulatedUser } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function populateProperty(
  property: PopulatedProperty,
  users?: PopulatedUser[],
  companies?: Company[],
): PopulatedProperty {
  const owner = users?.find((u) => u._id === property.ownerId._id);
  const company = companies?.find(
    (c) => c._id === property.ownerId?.companyId?._id,
  );
  if ((users && !owner) || (companies && !company))
    throw new Error("Owner / Company not found");
  return {
    ...property,
    ownerId: users ? owner : companies,
  } as PopulatedProperty;
}
