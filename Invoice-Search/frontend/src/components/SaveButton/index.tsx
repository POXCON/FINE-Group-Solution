import React from "react";
import { useTranslation } from "react-i18next";

// MUI Imports
import { Button } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

// Types Imports
import { DataType } from "@/types/Search/DataType";

// Context Imports
import { useSnackbar } from "@/contexts/SnackbarContext";

interface SaveButtonProps {
    tableData: DataType[];
    loading: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ tableData, loading }) => {
    const { t } = useTranslation();
    const { showSnackbar } = useSnackbar();

    const handleSave = () => {
        if (tableData.length > 0) {
            const csvData = convertToCSV(tableData);
            downloadCSV(csvData);
        } else {
            showSnackbar(t("NoDataToDownload"), "warning");
        }
    };

    const convertToCSV = (data: any[]) => {
        const headers = ["インボイス番号", "会社名", "住所"];
        const headerRow = headers.join(",") + "\n";
        const dataRows = data.map(item => {
            const rowData = [item.companyInvoiceNumber, item.companyName, item.address];
            return rowData.join(",");
        });
        return headerRow + dataRows.join("\n");
    };

    const downloadCSV = (csvData: string) => {
        const downloadLink = document.createElement("a");
        const blob = new Blob(["\uFEFF" + csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = "invoiceData.csv";
        downloadLink.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            variant="contained"
            size="large"
            startIcon={<CloudDownloadIcon />}
            onClick={handleSave}
            disabled={loading}
            sx={{ background: "linear-gradient(90deg, #21c2fe, #2077fe)", borderRadius: 15, color: "#fff", "&:hover": { background: "linear-gradient(90deg, #21c2fe, #2077fe)" } }}
        >
            {t("Download")}
        </Button>
    )
};  
