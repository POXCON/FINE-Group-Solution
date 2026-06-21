import React, { useState } from "react";
import { DataGrid, GridColDef, GridSortDirection, GridCellParams, GridSortModel } from "@mui/x-data-grid";
import { styled } from "@mui/system";
import { Box, useTheme } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { enUS as enUSDataGrid, jaJP as jaJPDataGrid } from "@mui/x-data-grid";

import { DataType } from "@/types/Search/DataType";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface DataTableProps {
    searchValues: string[];
    dataSource: DataType[];
    setTableData: React.Dispatch<React.SetStateAction<DataType[]>>;
};

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

const DataTable: React.FC<DataTableProps> = ({
    dataSource,
    setTableData,
}) => {
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
            field: "delete",
            headerName: t("DataDelete"),
            headerAlign: "center",
            cellClassName: "MuiDataGrid-cellCenter",
            flex: 1,
            sortable: false,
            renderCell: (params: GridCellParams) => (
                <DeleteOutlineIcon
                    sx={{ color: "red", cursor: "pointer" }}
                    onClick={() => {
                        setTableData((prevData) =>
                            prevData.filter((item) => item.id !== params.id)
                        );
                    }}
                />
            ),
        },
    ];

    return (
        <ThemeProvider theme={ getCurrentTheme }>
            <Box sx={{ height: "100%", width: "100%", minHeight: "300px" }}>
                <StyledDataGrid
                    theme={ getCurrentTheme }
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
            </Box>
        </ThemeProvider>
    );
};

export default DataTable;  
