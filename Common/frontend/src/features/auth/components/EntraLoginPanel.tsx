import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuthContext";
import { getErrorMessage } from "@/shared/lib/errors";

/** Microsoft のブランドカラー 4 分割ロゴ。 */
function MicrosoftLogo(): React.JSX.Element {
  return (
    <svg viewBox="0 0 21 21" aria-hidden="true" className="h-4 w-4">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

/**
 * Microsoft Entra ID サインインパネル。
 * 記憶トグルで cacheLocation を選択し、loginRedirect でサインインを開始する。
 * リダイレクトによりページ遷移するため、成功時のナビゲーションは復帰後に行われる。
 */
export function EntraLoginPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const { login, isAuthenticating } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFieldError(null);
    try {
      await login({ rememberMe });
    } catch (error: unknown) {
      setFieldError(getErrorMessage(error));
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* モバイル向けブランドマーク */}
      <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-content shadow-sm">
          <span className="text-2xl font-bold leading-none">F</span>
        </div>
        <span className="text-sm font-semibold text-base-content/60">
          {t("brand.suite")}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="label cursor-pointer justify-start gap-2.5 py-0">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span className="label-text text-sm">{t("auth.rememberMe")}</span>
        </label>

        {fieldError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-error/25 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {fieldError}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-2 w-full gap-2"
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <MicrosoftLogo />
          )}
          {isAuthenticating
            ? t("auth.signingIn")
            : t("auth.signInWithMicrosoft")}
        </button>
      </form>
    </div>
  );
}
