import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuthContext";
import { useTheme } from "@/shared/lib/theme/useTheme";

export function AppLayout(): React.JSX.Element {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? "active" : "";

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <header className="navbar bg-base-100 shadow lg:hidden">
          <label htmlFor="sidebar-toggle" className="btn btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-5 w-5 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
          <span className="navbar-center text-lg font-bold">{t("appName")}</span>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="sidebar-toggle" className="drawer-overlay" />
        <aside className="bg-base-200 min-h-full w-64 flex flex-col">
          <div className="p-4 text-lg font-bold">{t("appName")}</div>

          <ul className="menu flex-1 p-4">
            <li>
              <NavLink to="/search" className={navLinkClass}>
                {t("nav.search")}
              </NavLink>
            </li>
            <li>
              <NavLink to="/consistency-check" className={navLinkClass}>
                {t("nav.consistencyCheck")}
              </NavLink>
            </li>
          </ul>

          <div className="p-4 flex flex-col gap-2">
            <div className="text-sm text-base-content/60 truncate">{user?.email}</div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
            >
              {theme === "light" ? t("common.dark") : t("common.light")}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-error"
              onClick={() => { void logout(); }}
            >
              {t("common.logout")}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
