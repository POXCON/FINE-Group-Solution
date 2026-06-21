import React, { useContext, useEffect } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

// MUI Imports
import { useTheme } from "@mui/material/styles";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    Avatar,
    Breadcrumbs,
    Link,
    Paper
} from "@mui/material";
import { SelectChangeEvent } from '@mui/material/Select';
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";

// Routes Import
import routes from "@/routes/routes";

// Theme Import
import { ThemeContext } from "@/contexts/ThemeContext";
import { getAppBarStyle, getBreadcrumbHomeStyle, getBreadcrumbItemStyle, getHeaderTitleStyle, getMenuStyle } from "@/assets/theme/Header";

// Components Import
import SettingDrawer from "@/components/Drawer/Setting Drawer";

interface HeaderProps {
    onDrawerOpen: () => void;
    isMenuVisible: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onDrawerOpen, isMenuVisible }) => {
    // Drawer Settings
    const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = React.useState(false);

    // Theme Settings
    const { setThemeMode, currentTheme } = useContext(ThemeContext);
    const getCurrentTheme = useTheme();
    const appBarStyle = getAppBarStyle(getCurrentTheme);
    const breadcrumbHomeStyle = getBreadcrumbHomeStyle(getCurrentTheme);
    const breadcrumbItemStyle = getBreadcrumbItemStyle(getCurrentTheme);
    const headerTitleStyle = getHeaderTitleStyle(getCurrentTheme);
    const menuStyle = getMenuStyle(getCurrentTheme);
    
    // Language Settings
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const getCurrentRouteName = () => {
        const currentRoute = routes.find(route => route.path === location.pathname);
        return currentRoute ? currentRoute.name : "Default Route Name";
    };
    const currentRouteName = getCurrentRouteName();

    // Search API Settings
    const [searchApi, setSearchApi] = React.useState("webAPI");

    // Drawer Settings Functions
    const handleSettingsDrawerOpen = () => {
        setIsSettingsDrawerOpen(true);
    };

    const handleSettingsDrawerClose = () => {
        setIsSettingsDrawerOpen(false);
    };

    // Theme Settings Functions
    const handleThemeChange = (_event: React.MouseEvent<HTMLElement>, newTheme: string) => {
        if (newTheme === "light" || newTheme === "dark") {
            localStorage.setItem('theme', newTheme);
            setThemeMode(newTheme);
        }
    };

    // Language Settings Functions
    const handleLanguageChange = (event: SelectChangeEvent<string>) => {
        const newLanguage = event.target.value;
        i18n.changeLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
    };

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            i18n.changeLanguage(savedLanguage);
        }
    }, [i18n]);

    // Search API Settings Functions
    const handleAPIChange = (event: SelectChangeEvent<string>) => {
        const newSearchApi = event.target.value;
        if (newSearchApi === "webAPI") {
            localStorage.setItem('searchApi', newSearchApi);
            setSearchApi(newSearchApi);
        }
    };

    useEffect(() => {
        const savedSearchApi = localStorage.getItem('searchApi');
        if (savedSearchApi) {
            setSearchApi(savedSearchApi);
        }
    }, []);

    return (
        <AppBar position="static" sx={appBarStyle}>
            <Toolbar>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Box display="flex" flexDirection="column" justifyContent="center">
                        <Breadcrumbs aria-label="breadcrumb" sx={{ my: 0.5 }}>
                            <Link component={RouterLink} to="/" color="inherit" sx={{ display: "flex", alignItems: "center", fontSize: "small" }}>
                                <HomeIcon sx={breadcrumbHomeStyle} fontSize="small" />
                            </Link>
                            <Typography sx={breadcrumbItemStyle}>
                                {t(currentRouteName)}
                            </Typography>
                        </Breadcrumbs>
                        <Typography sx={headerTitleStyle}>
                            {t(currentRouteName)}
                        </Typography>
                    </Box>
                    <Paper
                        elevation={3}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '50px',
                            menuStyle,
                            p: 0.5,
                        }}
                    >
                        {isMenuVisible && (
                            <IconButton sx={{ mx: 0.5 }} onClick={onDrawerOpen}>
                                <MenuIcon sx={{ fontSize: "small" }} />
                            </IconButton>
                        )}
                        <IconButton sx={{ mx: 0.5 }} onClick={handleSettingsDrawerOpen}>
                            <SettingsIcon sx={{ fontSize: "small" }} />
                        </IconButton>
                        {
                            <Avatar
                                sx={{ mx: 0.5, width: 24, height: 24 }}
                            />
                        }
                    </Paper>
                </Box>
            </Toolbar>
            <SettingDrawer
                isOpen={isSettingsDrawerOpen}
                onClose={handleSettingsDrawerClose}
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
                language={i18n.language}
                onLanguageChange={handleLanguageChange}
                searchApi={searchApi}
                onSearchApiChange={handleAPIChange}
            />
        </AppBar>
    );
};
