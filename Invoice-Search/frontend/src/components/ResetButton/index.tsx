import React from 'react';
import { useTranslation } from "react-i18next";

// MUI Imports
import Button from '@mui/material/Button';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

type ResetButtonProps = {
    onReset: () => void;
    loading: boolean;
};

export const ResetButton: React.FC<ResetButtonProps> = ({ onReset, loading }) => {
    const { t } = useTranslation();

    return (
        <Button
            variant="outlined"
            color="primary"
            startIcon={<RestartAltIcon />}
            onClick={onReset}
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
            {t("Reset")}
        </Button>
    );
};  