import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuthContext";
import { useTheme } from "@/shared/lib/theme/useTheme";

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/search",
    labelKey: "nav.search",
    icon: (
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
          d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
        />
      </svg>
    ),
  },
  {
    to: "/consistency-check",
    labelKey: "nav.consistencyCheck",
    icon: (
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
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
];

function BrandMark(): React.JSX.Element {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-content shadow-sm">
      <span className="text-lg font-bold leading-none">F</span>
    </div>
  );
}

export function AppLayout(): React.JSX.Element {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentTitle =
    NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))?.labelKey ??
    "appName";

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/15 text-white"
        : "text-neutral-content/80 hover:bg-white/5 hover:text-white",
    ].join(" ");

  // モバイルではナビ選択後にドロワーを閉じる（デスクトップは lg:drawer-open で常時表示のため影響なし）
  const closeDrawer = (): void => {
    const toggle = document.getElementById("sidebar-toggle");
    if (toggle instanceof HTMLInputElement) {
      toggle.checked = false;
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "?";
  const userName = user?.email?.split("@")[0] ?? user?.email ?? "";

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-screen flex-col">
        {/* トップバー */}
        <header className="navbar sticky top-0 z-30 flex h-16 min-h-16 items-center gap-3 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur md:px-6">
          <label
            htmlFor="sidebar-toggle"
            className="btn btn-square btn-ghost btn-sm lg:hidden"
            aria-label="メニュー"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-5 w-5 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
          <h1 className="text-base font-semibold text-base-content md:text-lg">
            {t(currentTitle)}
          </h1>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* サイドバー */}
      <div className="drawer-side z-40">
        <label
          htmlFor="sidebar-toggle"
          className="drawer-overlay"
          aria-label="サイドバーを閉じる"
        />
        <aside className="flex min-h-full w-72 flex-col bg-neutral text-neutral-content">
          {/* ブランド */}
          <div className="flex items-center gap-3 px-5 py-5">
            <BrandMark />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-white">
                {t("appName")}
              </p>
              <p className="truncate text-xs text-neutral-content/60">
                {t("brand.suite")}
              </p>
            </div>
          </div>

          <div className="mx-5 border-t border-white/10" />

          {/* ナビゲーション */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-neutral-content/40">
              {t("brand.menu")}
            </p>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                onClick={closeDrawer}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          {/* フッター: ユーザー / テーマ / ログアウト */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/25 text-sm font-semibold text-white">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-white"
                  title={user?.email}
                >
                  {user?.name || userName}
                </p>
                <p className="text-xs text-neutral-content/50">
                  {t("brand.signedIn")}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-content/80 transition-colors hover:bg-white/5 hover:text-white"
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
                    className="h-4 w-4"
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
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                    />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-content/80 transition-colors hover:bg-error/20 hover:text-white"
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
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                  />
                </svg>
                <span className="lg:hidden xl:inline">{t("common.logout")}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
