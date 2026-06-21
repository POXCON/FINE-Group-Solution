import React, { createContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export const ThemeContext = createContext({
    setThemeMode: (_mode: "light" | "dark") => {},  
    currentTheme: "light",
});

interface CustomThemeProviderProps {
    children: React.ReactNode;
}

export const CustomThemeProvider = ({ children }: CustomThemeProviderProps) => {
    const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as "light" | "dark";
        if (savedTheme) {
            setThemeMode(savedTheme);
        }
    }, []);

    const theme = useMemo(() => {
        return createTheme({
            palette: {
                mode: themeMode,
            },
        });
    }, [themeMode]);

    return (
        <ThemeContext.Provider value={{ setThemeMode, currentTheme: themeMode }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeContext.Provider>
    );
};
