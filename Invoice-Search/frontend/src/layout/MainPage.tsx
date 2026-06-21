import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

// MUI Imports  
import { useTheme, useMediaQuery, Box, Container } from "@mui/material";

// Components Imports  
import { Header } from "@/components/Header";
import { DrawerMenu } from "@/components/Drawer/App Drawer";

export const MainPage: React.FC = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    useEffect(() => {
        if (isDesktop) {
            setIsDrawerOpen(true);
        }
    }, [isDesktop]);

    const handleDrawerOpen = () => {
        if (!isDesktop) {
            setIsDrawerOpen(true);
        }
    };

    const handleDrawerClose = () => {
        if (!isDesktop) {
            setIsDrawerOpen(false);
        }
    };

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 48px)",
            padding: "24px",
            overflow: "auto",
            backgroundColor: theme.palette.background.default,
            marginLeft: isDesktop ? theme.spacing(30) : 0
        }}>
            <Header
                onDrawerOpen={handleDrawerOpen}
                isMenuVisible={!isDesktop}
            />
            <DrawerMenu
                open={isDrawerOpen}
                onClose={handleDrawerClose}
                variant={isDesktop ? "permanent" : "temporary"}
                elevation={0}
            />
            <Container maxWidth={false} sx={{
                flex: "1 0 auto",
                paddingTop: "24px",
                paddingBottom: "24px",
                overflow: "auto",
            }}>
                <Outlet />
            </Container>
        </Box>
    );
}  
