import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuthContext";

export function ProtectedRoute(): React.JSX.Element {
  const { user, isInitializing } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span
          className="loading loading-spinner loading-lg"
          aria-label={t("common.loading")}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
