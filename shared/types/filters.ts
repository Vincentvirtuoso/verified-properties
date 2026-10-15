import { PropertyDocument } from "./property";
import { PropertyCategory, PropertyFeature, PropertyType } from "./property.sub";

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
  documents: PropertyDocument["type"][];
}