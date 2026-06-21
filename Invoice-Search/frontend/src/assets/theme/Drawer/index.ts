import { Theme } from "@mui/material/styles";

export const getListItemStyle = (theme: Theme, currentPath: string, path: string) => ({
    bgcolor: currentPath === path
        ? theme.palette.action.selected
        : "transparent",
});