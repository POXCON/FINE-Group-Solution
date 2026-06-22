import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { PortalPage } from "@/features/portal/components/PortalPage";

export function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<PortalPage />} />
      </Route>
    </Routes>
  );
}
