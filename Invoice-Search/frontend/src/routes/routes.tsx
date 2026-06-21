import { Routes, Route } from 'react-router-dom';

// Page Import  
import { MainPage } from "@/layout/MainPage";

// Layout Imports  
import { ConsistencyCheck } from "@/pages/ConsistencyCheck";
import { Dashboard } from "@/pages/Dashboard";
import { MultiSearch } from "@/pages/MultiSearch";
import { SingleSearch } from "@/pages/SingleSearch";

// MUI Icons Imports  
import DashboardIcon from "@mui/icons-material/Dashboard";
import SearchIcon from "@mui/icons-material/Search";
import GradingIcon from "@mui/icons-material/Grading";

// routes  
const routes = [
    {
        type: "collapse",
        name: "Dashboard",
        key: "dashboard",
        path: "/dashboard",
        icon: <DashboardIcon />,
        element: <Dashboard />,
        noCollapse: true,
        protected: false
    },
    {
        type: "collapse",
        name: "Single Search",
        key: "single-search",
        path: "/single-search",
        icon: <SearchIcon />,
        element: <SingleSearch />,
        noCollapse: true,
        protected: false
    },
    {
        type: "collapse",
        name: "Multi Search",
        key: "multi-search",
        path: "/multi-search",
        icon: <SearchIcon />,
        element: <MultiSearch />,
        noCollapse: true,
        protected: false
    },
    {
        type: "collapse",
        name: "Consistency Check",
        key: "consistency-check",
        path: "/consistency-check",
        icon: <GradingIcon />,
        element: <ConsistencyCheck />,
        noCollapse: true,
        protected: false
    },
];

export default routes;

export const renderRoutes = () => (
    <Routes>
        <Route path="/" element={<MainPage />}>
            <Route index path="/dashboard" element={<Dashboard />} />
            {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
            ))}
        </Route>
    </Routes>
);  
