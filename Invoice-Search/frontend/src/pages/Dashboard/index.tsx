import React from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// MUI Imports  
import { useTheme } from "@mui/material/styles";
import {
    Card,
    CardActionArea,
    CardContent,
    Typography,
    Grid,
    Box,
    Fade,
} from "@mui/material";

// Routes Import  
import routes from "@/routes/routes";

// Image Import  
import backgroundImage from "@/assets/img/lucas-k-wQLAGv4_OYs-unsplash.jpg";

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const dashboardRoutes = routes.slice(1, 4);
    const { t } = useTranslation();

    // Theme Settings  
    const getCurrentTheme = useTheme();

    return (
        <>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                width: "100%",
            }}>
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        mb: 0.25,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundClip: "text",
                        color: "transparent",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        userSelect: "none",
                    }}
                >
                    {t("DashboardGreeting")}
                </Typography>
                <Fade in={true} timeout={2500}>
                    <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ width: "100%", mt: 0.25, pr: 10, pl: 10 }}>
                        {dashboardRoutes.map((route, index) => (
                            <Grid item key={index} xs={12} sm={6} md={4} sx={{ height: "30vh" }}>
                                <Card
                                    elevation={3}
                                    sx={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        background: getCurrentTheme.palette.mode === "dark" ? "rgba(66, 66, 66, 0.9)" : "rgba(255, 255, 255, 0.9)",
                                        borderRadius: 5,
                                    }}
                                    onClick={() => navigate(route.path)}
                                >
                                    <CardActionArea
                                        sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            "&:hover": {
                                                transform: "scale(1.10)",
                                            },
                                            transition: "transform 0.3s ease-in-out",
                                            transform: "scale(1)"
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                {React.cloneElement(route.icon, { style: { fontSize: "50px" } })}
                                            </Box>
                                            <Typography gutterBottom variant="h5" component="div" textAlign="center">
                                                {t(route.name)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                                Navigate to {t(route.name)} →
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Fade>
            </Box>
        </>
    );
};  
