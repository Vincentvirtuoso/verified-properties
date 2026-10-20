export type PopularArea = {
  name: string;
  count: number | null;
};

const DUMMY_AREAS: PopularArea[] = [
  { name: "Lekki", count: 24 },
  { name: "Ikoyi", count: 12 },
  { name: "Victoria Island", count: 9 },
  { name: "Ajah", count: 15 },
  { name: "Maitama", count: 7 },
  { name: "Gwarinpa", count: 5 },
];

export function getPopularAreas(): PopularArea[] {
  return DUMMY_AREAS;
}
