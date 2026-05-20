"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  PropertyCategory,
  PropertyType,
  ListingPurpose,
  PropertyFeature,
  PropertyDocumentType,
} from "@/types";
import { Role } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export type ListPropertyStep =
  | "basic"
  | "details"
  | "location"
  | "media"
  | "review";

export const STEPS: ListPropertyStep[] = [
  "basic",
  "details",
  "location",
  "media",
  "review",
];

export interface ListPropertyFormData {
  title: string;
  listingPurpose: ListingPurpose | "";
  category: PropertyCategory | "";
  type: PropertyType | "";
  description: string;
  ownerType: "agent" | "landlord" | "company" | "";

  price: string;
  currency: string;
  negotiable: boolean;
  bedrooms: string;
  bathrooms: string;
  area: string;
  features: PropertyFeature[];

  address: string;
  city: string;
  state: string;
  country: string;

  imageFiles: File[];
  videoLinks: string[];
  documentFiles: { file: File; type: PropertyDocumentType | "" }[];
}

const STORAGE_KEY = "listPropertyFormData";

const getDefaultData = (
  ownerType: ListPropertyFormData["ownerType"] = "",
): ListPropertyFormData => ({
  title: "",
  listingPurpose: "",
  category: "",
  type: "",
  description: "",
  ownerType,
  price: "",
  currency: "NGN",
  negotiable: false,
  bedrooms: "",
  bathrooms: "",
  area: "",
  features: [],
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
  imageFiles: [],
  videoLinks: [""],
  documentFiles: [],
});

export function useListPropertyForm() {
  const { user } = useAuth();

  const userOwnerType = ((): ListPropertyFormData["ownerType"] => {
    if (!user?.activeRole) return "";
    if (user.activeRole === Role.Agent) return "agent";
    if (user.activeRole === Role.Landlord) return "landlord";
    if (user.activeRole === Role.Company) return "company";
    return "";
  })();

  const [formData, setFormData] = useState<ListPropertyFormData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ListPropertyFormData;
          if (userOwnerType && parsed.ownerType !== userOwnerType) {
            return { ...parsed, ownerType: userOwnerType };
          }
          return parsed;
        } catch {}
      }
    }
    return getDefaultData(userOwnerType);
  });

  const [currentStep, setCurrentStep] = useState<ListPropertyStep>("basic");
  const [errors, setErrors] = useState<
    Partial<Record<keyof ListPropertyFormData, string>>
  >({});

  const stepIndex = STEPS.indexOf(currentStep);

  useEffect(() => {
    if (userOwnerType && formData.ownerType !== userOwnerType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({ ...prev, ownerType: userOwnerType }));
    }
  }, [userOwnerType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const updateField = useCallback(
    <K extends keyof ListPropertyFormData>(
      key: K,
      value: ListPropertyFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [errors],
  );

  const goToStep = useCallback(
    (step: ListPropertyStep) => setCurrentStep(step),
    [],
  );

  const goNext = useCallback(() => {
    const next = STEPS[stepIndex + 1];
    if (next) setCurrentStep(next);
  }, [stepIndex]);

  const goPrev = useCallback(() => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setCurrentStep(prev);
  }, [stepIndex]);

  const validateStep = useCallback(
    (step: ListPropertyStep): boolean => {
      const newErrors: typeof errors = {};

      if (step === "basic") {
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.listingPurpose)
          newErrors.listingPurpose = "Select a purpose";
        if (!formData.category) newErrors.category = "Select a category";
        if (!formData.type) newErrors.type = "Select a property type";
        if (!formData.ownerType) newErrors.ownerType = "Select your role";
      }

      if (step === "details") {
        if (!formData.price || isNaN(Number(formData.price)))
          newErrors.price = "Enter a valid price";
        if (!formData.bedrooms || isNaN(Number(formData.bedrooms)))
          newErrors.bedrooms = "Enter number of bedrooms";
        if (!formData.bathrooms || isNaN(Number(formData.bathrooms)))
          newErrors.bathrooms = "Enter number of bathrooms";
      }

      if (step === "location") {
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) goNext();
  }, [validateStep, currentStep, goNext]);

  const resetForm = useCallback(() => {
    const defaultData = getDefaultData(userOwnerType);
    setFormData(defaultData);
    setCurrentStep("basic");
    setErrors({});
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [userOwnerType]);

  return {
    currentStep,
    stepIndex,
    formData,
    errors,
    updateField,
    goToStep,
    goNext,
    goPrev,
    handleNext,
    validateStep,
    resetForm,
  };
}
