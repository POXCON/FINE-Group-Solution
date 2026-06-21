import React from 'react';
import { useTranslation } from 'react-i18next';

// MUI Imports
import {
    Box,
    Typography,
    Drawer,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Divider,
    Select,
    MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import SearchIcon from '@mui/icons-material/Search';
import { SelectChangeEvent } from '@mui/material/Select';
import ReactCountryFlag from 'react-country-flag';

// Language Imports
import { languageList } from "@/languages/languageList";

interface SettingDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (event: React.MouseEvent<HTMLElement>, newTheme: string) => void;
    language: string;
    onLanguageChange: (event: SelectChangeEvent<string>) => void;
    searchApi: string;
    onSearchApiChange: (event: SelectChangeEvent<string>) => void;
}

const SettingDrawer: React.FC<SettingDrawerProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onThemeChange,
    language,
    onLanguageChange,
    searchApi,
    onSearchApiChange
}) => {
    const { t } = useTranslation();

    const selectedStyle = {
        color: "#fff",
        background: "linear-gradient(90deg, #21c2fe, #2077fe)",
        width: "100%",
        borderRadius: 1,
        fontWeight: "bold",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
            background: "linear-gradient(90deg, #21c2fe, #2077fe)",
        },
        "&.Mui-selected": {
            color: "#fff",
        },
        "&.Mui-selected:hover": {
            background: "linear-gradient(90deg, #21c2fe, #2077fe)",
            transform: "scale(1.05)",
        }
    };

    const unselectedStyle = {
        color: "#17c1e8",
        background: "#d6dae4",
        borderColor: "#17c1e8",
        width: "100%",
        borderRadius: 1,
        fontWeight: "bold",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
            color: "#fff",
            background: "#b0b8d1",
            transform: "scale(1.05)",
        },
    };

    const iconStyle = {
        marginRight: "8px"
    };

    return (
        <Drawer
            anchor="right"
            open={isOpen}
            onClose={onClose}
        >
            <Box sx={{ width: 300 }} role="presentation">
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                    <Typography variant="h6">{t("Settings")}</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider sx={{ backgroundImage: "linear-gradient(to right, transparent, rgba(0, 0, 0, 0.12), transparent)" }} />
                <Box sx={{ p: 2 }}>
                    <Typography gutterBottom>{t("Theme")}</Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={currentTheme}
                        onChange={onThemeChange}
                        size="small"
                        fullWidth
                        sx={{ width: "100%", borderRadius: 2 }}
                    >
                        <ToggleButton
                            key="light"
                            value="light"
                            sx={currentTheme === "light" ? selectedStyle : unselectedStyle}
                        >
                            <WbSunnyIcon sx={iconStyle} /> {t("Light")}
                        </ToggleButton>
                        <ToggleButton
                            key="dark"
                            value="dark"
                            sx={currentTheme === "dark" ? selectedStyle : unselectedStyle}
                        >
                            <NightsStayIcon sx={iconStyle} /> {t("Dark")}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Box sx={{ p: 2 }}>
                    <Typography gutterBottom>{t("Language")}</Typography>
                    <Select
                        labelId="language-select-label"
                        id="language-select"
                        value={language}
                        onChange={onLanguageChange}
                        sx={{ width: "100%", borderRadius: 2 }}
                    >
                        {languageList.map((language) => (
                            <MenuItem key={language.key} value={language.key}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ReactCountryFlag countryCode={language.countryCode} svg style={{ marginRight: '8px' }} alt={language.value} />
                                    {language.value}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
                <Box sx={{ p: 2 }}>
                    <Typography gutterBottom>{t("searchAPI")}</Typography>
                    <Select
                        id="api-select"
                        value={searchApi}
                        onChange={onSearchApiChange}
                        sx={{ width: "100%", borderRadius: 2 }}
                    >
                        <MenuItem key="webAPI" value="webAPI">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SearchIcon sx={iconStyle} /> {t("webAPI")}
                            </Box>
                        </MenuItem>
                    </Select>
                </Box>
            </Box>
        </Drawer>
    );
};

export default SettingDrawer;  