// React Imports

import { useContext } from "react";
import { SettingsContext } from "../contexts/settingsContext";

// Context Imports

export const useSettings = () => {
  // Hooks
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider"
    );
  }

  return context;
};
