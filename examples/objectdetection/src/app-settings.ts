import type { Delegate } from "react-native-mediapipe";
import * as React from "react";

export type AppSettings = {
  maxResults: number;
  threshold: number;
  processor: Delegate;
  model: string;
};

export const SettingsContext = React.createContext<
  | {
      settings: AppSettings;
      setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    }
  | undefined
>(undefined);

export const useSettings = () => {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
