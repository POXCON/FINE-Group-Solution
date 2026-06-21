import React, { useState, useEffect } from "react";
import { TextField, Grid, Typography, Paper, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getTextFieldStyle } from "@/assets/theme/SearchBox";

type SearchBoxProps = {
    loading?: boolean;
    searchValues: string[];
    onChange: (values: string[]) => void;
    onError: (errorIndices: number[]) => void;
};

export const SearchBox: React.FC<SearchBoxProps> = ({ loading, searchValues, onChange, onError }) => {
    // Theme Settings
    const getCurrentTheme = useTheme();
    const textFieldTheme = getTextFieldStyle(getCurrentTheme);

    const [errorIndices, setErrorIndices] = useState<number[]>([]);
    const { t } = useTranslation();

    const handleSearchInputChange = (value: string, index: number) => {
        const newSearchValues = [...searchValues];
        newSearchValues[index] = value;
        onChange(newSearchValues);
    };

    useEffect(() => {
        const newErrorIndices = searchValues.map((value, index) => value && (!/^\d+$/.test(value) || value.length !== 13) ? index : -1).filter(index => index !== -1);
        setErrorIndices(newErrorIndices);
        onError(newErrorIndices);
    }, [searchValues, onError]);

    const renderSearchBoxes = () => {
        return (
            <Paper elevation={3} sx={{ padding: 2, margin: 1, borderRadius: 5, width: "100%" }}>
                <Typography variant="h6" sx={{ padding: 2, fontWeight: "bold" }}>
                    {t("InvoiceNumberSearch")}
                </Typography>
                {Array.from({ length: 1 }, (_, i) => (
                    <TextField
                        key={i}
                        error={errorIndices.includes(i)}
                        sx={{
                            ...textFieldTheme,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                            },
                        }}
                        InputProps={{
                            startAdornment: "T",
                        }}
                        placeholder={" " + t("InputInvoiceNumber")}
                        size="medium"
                        disabled={loading}
                        onChange={(e) => handleSearchInputChange(e.target.value, i)}
                        value={searchValues[i] || ""}
                        variant="outlined"
                        fullWidth
                        autoComplete='off'
                    />
                ))}
            </Paper>
        );
    };

    return (
        <Grid container spacing={1}>{renderSearchBoxes()}</Grid>
    );
};  
