import { PropertyCategory, PropertyFeature, PropertyType } from "./property";

export interface PropertyFilterState {
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  category: PropertyCategory | "all";
  type: PropertyType[];
  features: PropertyFeature[];
  location: string;
  minArea: number;
  maxArea: number;
  agent: string;
  documents: string[];
}
