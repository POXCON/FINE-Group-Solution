import React from "react";
import { useTranslation } from "react-i18next";

// MUI Imports
import { Button, CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

// Context Imports
import { useSnackbar } from "@/contexts/SnackbarContext";

type SearchButtonProps = {
    onClick: (searchValues: string[]) => Promise<void>;
    loading: boolean;
    searchValues: string[];
};

export const SearchButton: React.FC<SearchButtonProps> = ({ onClick, loading, searchValues }) => {
    const { t } = useTranslation();
    const { showSnackbar } = useSnackbar();

    const handleOnClick = () => {
        const areAllValuesEmpty = searchValues.every(value => value === '');  
        if (!areAllValuesEmpty) {
            onClick(searchValues);
        } else {
            showSnackbar(t("NoDataToSearch"), "warning");
        };
    };

    return (
        <Button
            variant="contained"
            size="large"
            startIcon={
                loading ? (
                    <CircularProgress size={20} color="inherit" />
                ) : (
                    <SearchIcon />
                )
            }
            onClick={handleOnClick}
            disabled={loading}
            sx={{
                background: "linear-gradient(90deg, #21c2fe, #2077fe)",
                borderRadius: 15,
                color: "#fff",
                "&:hover": { background: "linear-gradient(90deg, #21c2fe, #2077fe)"
            }}}
        >
            {t("Search")}
        </Button>
    );
};  
