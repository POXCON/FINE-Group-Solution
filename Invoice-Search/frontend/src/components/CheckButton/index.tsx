import React from 'react';
import { useTranslation } from "react-i18next";

// MUI Imports
import { Button, CircularProgress } from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";

type CheckButtonProps = {
    onCheck: () => Promise<void>;
    loading: boolean;
};

export const CheckButton: React.FC<CheckButtonProps> = ({ onCheck, loading }) => {
    const { t } = useTranslation();

    const handleOnClick = () => {
        onCheck();
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
                "&:hover": {
                    background: "linear-gradient(90deg, #21c2fe, #2077fe)"
                }
            }}
        >
            {t("Check")}
        </Button>
    );
};  