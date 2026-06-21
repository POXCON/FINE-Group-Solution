import React from "react";
import ReactDOM from "react-dom/client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./languages/en-us/en";
import { ja } from "./languages/ja-jp/ja";

import { SnackbarProvider } from 'notistack';

import App from "@/App";

// Contexts Imports
import { CustomThemeProvider } from "@/contexts/ThemeContext";

// CSS Imports
import "./index.css";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      ja: ja
    },
    lng: navigator.language,
    fallbackLng: "en",

    interpolation: {
      escapeValue: false
    }
  });

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <CustomThemeProvider>
        <App />
      </CustomThemeProvider>
    </SnackbarProvider>
  </React.StrictMode>
);