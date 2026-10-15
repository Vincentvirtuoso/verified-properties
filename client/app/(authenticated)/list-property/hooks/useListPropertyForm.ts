/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  PropertyCategory,
  PropertyType,
  ListingPurpose,
  PropertyFeature,
  PropertyDocumentType,
  MediaSection,
} from "@affilhomes/shared/types";
import { Role } from "@affilhomes/shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { isInNigeria } from "@affilhomes/shared/utils/geo";
import {
  saveDraftPhotos,
  loadDraftPhotos,
  clearDraftPhotos,
  type DraftPhoto,
} from "@affilhomes/shared/utils/draft-photos";
import { MAX_IMAGES } from "../components/constants";

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
  ownerType: "agent" | "company" | "";

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
  coordinates: { lat: number; lng: number } | null;
  locationVisibility: "public" | "private";

  imageFiles: File[];
  imageSections: MediaSection[];
  videoLinks: string[];

  documentTypes: PropertyDocumentType[];
}

const STORAGE_KEY = "listPropertyFormData";
const COMPLETED_STEPS_KEY = `${STORAGE_KEY}:completedSteps`;
const PHOTO_SAVE_DEBOUNCE_MS = 400;

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
  coordinates: null,
  imageFiles: [],
  videoLinks: [""],
  documentTypes: [],
  imageSections: [],
  locationVisibility: "private",
});

function hasMeaningfulContent(data: ListPropertyFormData): boolean {
  return Boolean(
    data.title.trim() ||
    data.description.trim() ||
    data.address.trim() ||
    data.price.trim(),
  );
}

function readInitialFormData(
  ownerType: ListPropertyFormData["ownerType"] = "",
): ListPropertyFormData {
  if (typeof window === "undefined") return getDefaultData(ownerType);

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return getDefaultData(ownerType);

  try {
    const parsed = JSON.parse(saved) as Partial<ListPropertyFormData>;
    const restored: ListPropertyFormData = {
      ...getDefaultData(ownerType),
      ...parsed,
      imageFiles: [],
      bedrooms: parsed.bedrooms ?? "",
      bathrooms: parsed.bathrooms ?? "",
      type: parsed.type ?? "",
      category: parsed.category ?? "",
      price: parsed.price ?? "",
      area: parsed.area ?? "",
    };
    return hasMeaningfulContent(restored)
      ? restored
      : getDefaultData(ownerType);
  } catch {
    return getDefaultData(ownerType);
  }
}

function readInitialCompletedSteps(): ListPropertyStep[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPLETED_STEPS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is ListPropertyStep =>
      STEPS.includes(s as ListPropertyStep),
    );
  } catch {
    return [];
  }
}

function readStepFromHash(): ListPropertyStep {
  if (typeof window === "undefined") return "basic";
  const hash = window.location.hash.slice(1);
  return STEPS.includes(hash as ListPropertyStep)
    ? (hash as ListPropertyStep)
    : "basic";
}

function resolveAllowedStep(
  requested: ListPropertyStep,
  completed: ListPropertyStep[],
): ListPropertyStep {
  const firstIncomplete = STEPS.findIndex((s) => !completed.includes(s));
  const maxIndex = firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete;
  return STEPS.indexOf(requested) <= maxIndex ? requested : STEPS[maxIndex];
}

function draftPhotoToFile(photo: DraftPhoto): File {
  return new File([photo.blob], photo.name, {
    type: photo.type,
    lastModified: photo.lastModified,
  });
}

export function useListPropertyForm() {
  const { user } = useAuth();

  const [formData, setFormData] = useState<ListPropertyFormData>(() =>
    readInitialFormData(),
  );
  const [completedSteps, setCompletedSteps] = useState<ListPropertyStep[]>(
    readInitialCompletedSteps,
  );
  const [currentStep, setCurrentStep] = useState<ListPropertyStep>(() =>
    resolveAllowedStep(readStepFromHash(), readInitialCompletedSteps()),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ListPropertyFormData, string>>
  >({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [photosHydrated, setPhotosHydrated] = useState(false);

  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const [missingPhotoCount, setMissingPhotoCount] = useState(0);
  const [photoSaveFailed, setPhotoSaveFailed] = useState(false);

  const PHOTO_COUNT_KEY = `${STORAGE_KEY}:photoCount`;

  const stepIndex = STEPS.indexOf(currentStep);

  const userOwnerType = ((): ListPropertyFormData["ownerType"] => {
    if (!user?.activeRole) return "";
    if (user.activeRole === Role.Agent) return "agent";
    if (user.activeRole === Role.Company) return "company";
    return "";
  })();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ListPropertyFormData;
          if (hasMeaningfulContent(parsed)) {
            setDraftAvailable(true);
          }
        } catch (e) {
          console.error(e, "Failed to parse saved form data");
        }
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hasText = hasMeaningfulContent(readInitialFormData());
    const expected = Number(window.localStorage.getItem(PHOTO_COUNT_KEY) ?? 0);

    loadDraftPhotos()
      .catch((e) => {
        console.error(e, "Failed to restore draft photos");
        return [] as DraftPhoto[];
      })
      .then((photos) => {
        if (cancelled) return;
        if (hasText || photos.length > 0) setDraftAvailable(true);
        if (photos.length > 0) {
          setFormData((prev) =>
            prev.imageFiles.length > 0
              ? prev
              : {
                  ...prev,
                  imageFiles: photos.map(draftPhotoToFile),
                  imageSections: photos.map(
                    (p) => (p.section ?? "general") as MediaSection,
                  ),
                },
          );
        }
        setMissingPhotoCount(Math.max(expected - photos.length, 0));
        setPhotosHydrated(true);
      });

    setIsInitialized(true);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      isInitialized &&
      userOwnerType &&
      formData.ownerType !== userOwnerType
    ) {
      setFormData((prev) => ({ ...prev, ownerType: userOwnerType }));
    }
  }, [isInitialized, userOwnerType, formData.ownerType]);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      const { imageFiles, imageSections, ...rest } = formData;
      void imageFiles;
      void imageSections;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    }
  }, [formData, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !photosHydrated || typeof window === "undefined") {
      return;
    }

    const handle = window.setTimeout(() => {
      localStorage.setItem(PHOTO_COUNT_KEY, String(formData.imageFiles.length));
      const save =
        formData.imageFiles.length === 0
          ? clearDraftPhotos()
          : saveDraftPhotos(formData.imageFiles, formData.imageSections);
      save
        .then(() => setPhotoSaveFailed(false))
        .catch((e) => {
          console.error(e, "Failed to save draft photos");
          setPhotoSaveFailed(true);
        });
    }, PHOTO_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [
    formData.imageFiles,
    formData.imageSections,
    isInitialized,
    photosHydrated,
  ]);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    try {
      localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(completedSteps));
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.warn(err);
    }
  }, [completedSteps, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    const target = `#${currentStep}`;
    if (window.location.hash === target) return;

    const hashIsValid = STEPS.includes(
      window.location.hash.slice(1) as ListPropertyStep,
    );

    if (hashIsValid) {
      window.history.pushState(null, "", target);
    } else {
      window.history.replaceState(null, "", target);
    }
  }, [currentStep, isInitialized]);

  useEffect(() => {
    const syncFromUrl = () => {
      const requested = readStepFromHash();
      const next = resolveAllowedStep(requested, completedSteps);

      if (next !== requested) {
        window.history.replaceState(null, "", `#${next}`);
      }
      setCurrentStep((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, [completedSteps]);

  const updateField = useCallback(
    <K extends keyof ListPropertyFormData>(
      key: K,
      value: ListPropertyFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const goToStep = useCallback((step: ListPropertyStep) => {
    setCurrentStep(step);
  }, []);

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
        if (!formData.ownerType) newErrors.ownerType = "Owner type is required";
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
        if (!formData.country.trim()) newErrors.country = "Country is required";

        if (!formData.coordinates) {
          newErrors.coordinates = "Pin the exact location on the map";
        } else if (
          formData.country.trim().toLowerCase() === "nigeria" &&
          !isInNigeria(formData.coordinates.lat, formData.coordinates.lng)
        ) {
          newErrors.coordinates = "The pin must be inside Nigeria";
        }
      }

      if (step === "media") {
        if (formData.imageFiles.length === 0) {
          newErrors.imageFiles =
            "Add at least one photo. The first photo becomes the cover.";
        }
        if (formData.imageFiles.length > MAX_IMAGES) {
          newErrors.imageFiles = `Up to ${MAX_IMAGES} photos allowed`;
        }
          if (formData.imageSections.length !== formData.imageFiles.length) {
            newErrors.imageFiles =
              "Photo sections are out of sync. Please re-add the photos.";
          }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  const markCompleted = useCallback((step: ListPropertyStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) goNext();
  }, [validateStep, currentStep, goNext]);

  const resetForm = useCallback(() => {
    const defaultData = getDefaultData(userOwnerType);
    setFormData(defaultData);
    setCurrentStep("basic");
    setErrors({});
    setDraftAvailable(false);
    setCompletedSteps([]);
    void clearDraftPhotos().catch((e) =>
      console.error(e, "Failed to clear draft photos"),
    );
    setMissingPhotoCount(0);
    setPhotoSaveFailed(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COMPLETED_STEPS_KEY);
      localStorage.removeItem(PHOTO_COUNT_KEY);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, [userOwnerType]);

  const discardDraft = useCallback(() => {
    resetForm();
    setDraftDismissed(true);
  }, [resetForm]);

  const keepDraft = useCallback(() => {
    setDraftDismissed(true);
  }, []);

  return {
    currentStep,
    stepIndex,
    formData,
    errors,
    isInitialized,
    photosHydrated,
    completedSteps,
    markCompleted,
    updateField,
    goToStep,
    goNext,
    goPrev,
    handleNext,
    validateStep,
    resetForm,
    userOwnerType,
    draftAvailable,
    draftDismissed,
    discardDraft,
    keepDraft,
    missingPhotoCount,
    photoSaveFailed,
  };
  
}
