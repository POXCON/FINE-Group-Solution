import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataType } from "@/types/Consistency Check/DataType";

// MUI Imports
import { Box, IconButton, Dialog, DialogActions, Button, DialogTitle, DialogContent, DialogContentText, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridSortDirection, GridCellParams, GridSortModel } from "@mui/x-data-grid";
import { styled } from "@mui/system";
import { ThemeProvider } from "@mui/material/styles";
import { enUS as enUSDataGrid, jaJP as jaJPDataGrid } from "@mui/x-data-grid";
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DoDisturbIcon from '@mui/icons-material/DoDisturb';

interface DataTableProps {
    dataSource: DataType[];
    handleMerge: (id: string) => void;
    checkConsistency: (row: DataType) => boolean;
}

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    "& .MuiDataGrid-columnHeaderTitle": {
        fontWeight: "bold",
    },
    "& .MuiDataGrid-columnHeader": {
        background: "linear-gradient(180deg, #21c2fe, #2077fe)",
        color: "#fff",
    },
    "& .MuiDataGrid-cell": {
        backgroundColor: theme.palette.background.dark,
        color: theme.palette.text.primary
    },
    "& .MuiDataGrid-cellCenter": {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
        width: "0.4em",
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
        background: "#f1f1f1",
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
        backgroundColor: "#888",
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover": {
        background: "#555",
    },
}));

const DataTable: React.FC<DataTableProps> = ({ dataSource, handleMerge, checkConsistency }) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const getCurrentTheme = useTheme();

    const gridLocaleText = currentLanguage === "ja"
        ? jaJPDataGrid.components.MuiDataGrid.defaultProps.localeText
        : enUSDataGrid.components.MuiDataGrid.defaultProps.localeText;

    const [sortModel, setSortModel] = useState([
        {
            field: "companyInvoiceNumber",
            sort: "asc" as GridSortDirection,
        },
    ]);

    // ダイアログの状態を管理するステート  
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // ダイアログを開く関数  
    const handleClickOpen = (id: string) => {
        setSelectedId(id);
        setOpen(true);
    };

    // ダイアログを閉じる関数  
    const handleClose = () => {
        setOpen(false);
    };

    // マージを承認したときの処理  
    const handleAgree = () => {
        if (selectedId) {
            handleMerge(selectedId);
        }
        handleClose();
    };

    const columns: GridColDef[] = [
        {
            field: "companyInvoiceNumber",
            headerName: t("InvoiceNumber"),
            headerAlign: "center",
            flex: 1,
            sortable: true,
        },
        {
            field: "companyName",
            headerName: t("CompanyName"),
            headerAlign: "center",
            flex: 1,
            sortable: true,
        },
        {
            field: "address",
            headerName: t("Address"),
            headerAlign: "center",
            flex: 1,
            sortable: true,
        },
        {
            field: "consistency",
            headerName: t("Consistency"),
            headerAlign: "center",
            cellClassName: 'MuiDataGrid-cellCenter',
            flex: 1,
            sortable: true,
            renderCell: (params: GridCellParams) => {
                const isConsistent = checkConsistency(params.row as DataType);
                return isConsistent ? (
                    <CheckIcon style={{ color: 'green' }} />
                ) : (
                    <CloseIcon style={{ color: 'red' }} />
                );
            },
        },
        {
            field: "merge",
            headerName: t("Merge"),
            headerAlign: "center",
            cellClassName: "MuiDataGrid-cellCenter",
            flex: 1,
            sortable: false,
            renderCell: (params: GridCellParams) => {
                const isConsistent = checkConsistency(params.row as DataType);
                return isConsistent ? (
                    <DoDisturbIcon color="disabled" />
                ) : (
                    <IconButton onClick={() => handleClickOpen(params.row.id)}>
                        <CallMergeIcon />
                    </IconButton>
                );
            }
        },
    ];

    return (
        <ThemeProvider theme={getCurrentTheme}>
            <Box sx={{ height: "100%", width: "100%", minHeight: "300px" }}>
                <StyledDataGrid
                    theme={getCurrentTheme}
                    rows={dataSource}
                    columns={columns}
                    sortModel={sortModel}
                    localeText={gridLocaleText}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 20, 30]}
                    onSortModelChange={(model: GridSortModel) => setSortModel(model)}
                    disableRowSelectionOnClick
                />
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>{"マージの確認"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            選択したデータをマージしますか？
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="primary">
                            いいえ
                        </Button>
                        <Button onClick={handleAgree} color="primary" autoFocus>
                            はい
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};

export default DataTable;
