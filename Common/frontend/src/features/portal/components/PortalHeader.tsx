import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuthContext";
import { useTheme } from "@/shared/lib/theme/useTheme";
import { displayName } from "../lib/displayName";

export function PortalHeader(): React.JSX.Element {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const name = displayName(user);
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <header className="navbar sticky top-0 z-30 flex h-16 min-h-16 items-center gap-3 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur md:px-6">
      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-content shadow-sm">
          <span className="text-lg font-bold leading-none">F</span>
        </div>
        <span className="text-base font-semibold text-base-content md:text-lg">
          {t("brand.suite")}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square"
          onClick={toggleTheme}
          aria-label={theme === "light" ? t("common.dark") : t("common.light")}
        >
          {theme === "light" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          )}
        </button>

        <div className="mx-1 flex items-center gap-2 rounded-lg px-1 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initial}
          </div>
          <span
            className="hidden max-w-[10rem] truncate text-sm font-medium text-base-content sm:block"
            title={user?.email}
          >
            {name}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm gap-2"
          onClick={() => {
            void logout();
          }}
          aria-label={t("common.logout")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>
          <span className="hidden md:inline">{t("common.logout")}</span>
        </button>
      </div>
    </header>
  );
}
