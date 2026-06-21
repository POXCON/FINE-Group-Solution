import { useTranslation } from "react-i18next";
import { LoginForm } from "./LoginForm";

export function LoginPage(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* 左: ブランドパネル（デスクトップのみ） */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-neutral p-12 text-neutral-content lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(60rem 60rem at 110% -10%, rgba(59,130,246,0.45), transparent 60%), radial-gradient(40rem 40rem at -10% 110%, rgba(14,116,144,0.4), transparent 55%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-content shadow-sm">
            <span className="text-xl font-bold leading-none">F</span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            {t("brand.suite")}
          </span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-snug text-white">
            {t("appName")}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-content/70">
            {t("auth.heroLead")}
          </p>
        </div>

        <p className="relative text-xs text-neutral-content/40">
          © FINE Group Solution
        </p>
      </aside>

      {/* 右: ログインフォーム */}
      <main className="flex w-full flex-1 items-center justify-center p-6">
        <LoginForm />
      </main>
    </div>
  );
}
