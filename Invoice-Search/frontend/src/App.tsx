import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { SearchPage } from "@/features/search/components/SearchPage";
import { ConsistencyCheckPage } from "@/features/consistency-check/components/ConsistencyCheckPage";
import { AppLayout } from "@/app/layout/AppLayout";

export function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/consistency-check" element={<ConsistencyCheckPage />} />
          <Route path="/" element={<Navigate to="/search" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
