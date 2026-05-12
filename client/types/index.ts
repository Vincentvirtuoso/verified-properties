export interface Stats {
  totalProperties: number;
  cities: number;
  agents: number;
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
