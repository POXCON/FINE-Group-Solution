import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

// MUI Imports
import { Paper, Typography, Button, Box, Grid } from "@mui/material";

// Context Imports
import { useSnackbar } from "@/contexts/SnackbarContext";

type FilePickerProps = {
    onFileSelected: (file: File) => void;
    loading: boolean;
    resetFlag: boolean;
};

export const FilePicker: React.FC<FilePickerProps> = ({ onFileSelected, loading, resetFlag }) => {
    const [selectedFileName, setSelectedFileName] = useState("");
    const { t } = useTranslation();
    const { showSnackbar } = useSnackbar();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {  
            const file = acceptedFiles[0];
            setSelectedFileName(file.name);
            onFileSelected(file);
        }
    }, [onFileSelected]);

    const { fileRejections, getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        noClick: true,
        accept: { "text/csv": [] },
        maxFiles: 1
    });

    useEffect(() => {  
        if (resetFlag) {  
            setSelectedFileName("");
        }  
    }, [resetFlag]);

    useEffect(() => {  
        if (fileRejections.length > 0) {  
            const rejection = fileRejections[0];  
            const file = rejection.file;  
            const errors = rejection.errors;
            if (file && errors) {
                const errorMessage = `${file.name}${t("FileError")}`;  
                showSnackbar(errorMessage, "error");
            }
        }  
    }, [fileRejections, t, showSnackbar]); 

    const renderSearchBoxes = () => {
        return (
            <Paper elevation={3} sx={{ padding: 2, margin: 1, borderRadius: 5, width: "100%" }}>
                <Typography variant="h6" sx={{ padding: 2, fontWeight: "bold", textAlign: "left" }}>
                    {t("FileUpload")}
                </Typography>
                <Box
                    {...getRootProps()}
                    sx={{
                        width: "calc(100% - 60px)",
                        textAlign: "center",
                        p: "20px",
                        border: "2px dashed #ccc",
                        borderRadius: "5px",
                        cursor: "pointer",
                        margin: "0 auto",
                    }}
                >
                    <input
                        {...getInputProps()}
                        disabled={loading}
                    />
                    <Typography sx={{userSelect: "none"}}>{t("FileDrop")}</Typography>
                    <Button type="button" onClick={open} disabled={loading} sx={{ marginTop: "8px", userSelect: "none" }} >
                        {t("FileSelect")}
                    </Button>
                </Box>
                {selectedFileName ? (
                    <Typography sx={{ marginTop: "8px", textAlign: "center", userSelect: "none" }}>
                        {t("FileSelected")}{selectedFileName}
                    </Typography>
                ) : (
                    <Typography sx={{ marginTop: "8px", textAlign: "center", userSelect: "none" }}>
                        {t("FileUnselected")}
                    </Typography>
                )}
            </Paper>
        );
    };

    return (
        <Grid container spacing={1}>
            {renderSearchBoxes()}
        </Grid>
    );
};
