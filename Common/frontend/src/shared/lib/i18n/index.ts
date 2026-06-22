import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./resources/en";
import { ja } from "./resources/ja";

export const SUPPORTED_LANGUAGES = ["ja", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "fine-portal.language";

function detectInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "ja" || stored === "en") {
    return stored;
  }
  return navigator.language.startsWith("ja") ? "ja" : "en";
}

void i18next.use(initReactI18next).init({
  resources: { en, ja },
  lng: detectInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18next.on("languageChanged", (language) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});

export default i18next;
