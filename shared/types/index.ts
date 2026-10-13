export interface Stats {
  totalProperties: number;
  cities: number;
  owners: number;
  happyClients: number;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  text: string;
  rating: number;
}

export * from "./property";
export * from "./filters";
export * from "./stats";
export * from "./user";
export * from "./inquiry";
export * from "./transaction";
export * from "./company";
export * from "./jv-property";
export * from "./course";
export * from "./podcast";
export * from "./enquiry";
