import SavedPropertiesClient from "./SavedPropertiesClient";
import { getMockSavedProperties } from "@/data/saved-properties";

const CURRENT_USER_ID = "user_001";

export default function SavedPropertiesPage() {
  const properties = getMockSavedProperties(CURRENT_USER_ID);

  return <SavedPropertiesClient properties={properties} />;
}