export const SIDEBAR_EXPANDED_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

import {
  PropertyType,
  PropertyCategory,
  PropertyFeature,
} from "@/types/property";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  singleFamilyHouse: "Single-family house",
  apartment: "Apartment / Flat",
  terrace: "Terrace / Townhouse",
  detachedDuplex: "Detached duplex",
  semiDetachedDuplex: "Semi-detached duplex",
  terraceDuplex: "Terraced duplex",
  duplexWithBQ: "Duplex with BQ",
  duplexWithPenthouse: "Duplex with penthouse",
  duplexVilla: "Duplex villa",
  duplexMaisonette: "Duplex maisonette",
  gardenDuplex: "Garden duplex",
  smartDuplex: "Smart duplex",
  studentHostel: "Student hostel",
  servicedApartment: "Serviced apartment",
  officeSpace: "Office space",
  retailShop: "Retail shop / Mall",
  warehouse: "Warehouse / Logistics hub",
  hotel: "Hotel / Guest house",
  factory: "Factory",
  industrialPark: "Industrial park",
  coldStorage: "Cold storage facility",
  residentialLand: "Residential land",
  commercialLand: "Commercial land",
  agriculturalLand: "Agricultural land",
  mixedUseLand: "Mixed-use land",
  mixedUseDevelopment: "Mixed-use development",
  resortAndEventCenter: "Resort / Event center",
  schoolOrHospital: "School / Hospital",
};

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  land: "Land",
  mixedUse: "Mixed-use",
  hospitality: "Hospitality",
  institutional: "Institutional",
};

export const PROPERTY_FEATURE_LABELS: Record<PropertyFeature, string> = {
  boysQuarters: "Boys’ quarters",
  penthouse: "Penthouse",
  garden: "Garden",
  smartHome: "Smart home",
  furnished: "Furnished",
  serviced: "Serviced",
};

export interface Country {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
  maxLength: number;
  iso: string;
}

export const countries: Country[] = [
  {
    iso: "ng",
    code: "+234",
    name: "Nigeria",
    flag: "🇳🇬",
    placeholder: "801 234 5678",
    maxLength: 10,
  },
  {
    iso: "gh",
    code: "+233",
    name: "Ghana",
    flag: "🇬🇭",
    placeholder: "501 234 567",
    maxLength: 9,
  },
  {
    iso: "ke",
    code: "+254",
    name: "Kenya",
    flag: "🇰🇪",
    placeholder: "712 345 678",
    maxLength: 9,
  },
  {
    iso: "za",
    code: "+27",
    name: "South Africa",
    flag: "🇿🇦",
    placeholder: "71 234 5678",
    maxLength: 9,
  },
  {
    iso: "eg",
    code: "+20",
    name: "Egypt",
    flag: "🇪🇬",
    placeholder: "10 123 4567",
    maxLength: 10,
  },
  {
    iso: "et",
    code: "+251",
    name: "Ethiopia",
    flag: "🇪🇹",
    placeholder: "91 234 5678",
    maxLength: 9,
  },
  {
    iso: "ug",
    code: "+256",
    name: "Uganda",
    flag: "🇺🇬",
    placeholder: "71 234 5678",
    maxLength: 9,
  },
  {
    iso: "tz",
    code: "+255",
    name: "Tanzania",
    flag: "🇹🇿",
    placeholder: "71 234 5678",
    maxLength: 9,
  },
];
