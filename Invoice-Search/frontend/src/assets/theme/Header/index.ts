import { Theme } from "@mui/material/styles";

export const getAppBarStyle = (_theme: Theme) => ({
    background: "transparent",
    boxShadow: "none",
    paddingTop: "8px",
    paddingBottom: "8px"
});

export const getBreadcrumbHomeStyle = (theme: Theme) => ({
    mr: 0.5,
    color: theme.palette.mode === "dark" ? theme.palette.common.white : "#344767"
});

export const getBreadcrumbItemStyle = (theme: Theme) => ({
    color: theme.palette.mode === "dark" ? theme.palette.common.white : "#344767",
    display: "flex",
    alignItems: "center",
    fontSize: "12px"
});

export const getHeaderTitleStyle = (theme: Theme) => ({
    fontWeight: "bold",
    fontSize: "1rem",
    color: theme.palette.mode === "dark" ? theme.palette.common.white : "#344767"
});

export const getMenuStyle = (theme: Theme) => ({
    background: theme.palette.mode === "dark" ? "rgba(66, 66, 66, 0.9)" : "rgba(255, 255, 255, 0.9)",
});