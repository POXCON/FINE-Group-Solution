import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { loginSchema } from "../types/loginSchema";
import { isMockAuthMode } from "../api/authClient";
import { getErrorMessage } from "@/shared/lib/errors";

interface LocationState {
  from?: { pathname: string };
}

export function LoginForm(): React.JSX.Element {
  const { t } = useTranslation();
  const { login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFieldError(null);

    const parsed = loginSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      setFieldError(t("auth.invalidCredentials"));
      return;
    }

    try {
      await login(parsed.data);
      const state = location.state as LocationState | null;
      const redirectTo = state?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });
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

      {isMockAuthMode() && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2 rounded-lg border border-info/25 bg-info/10 px-3 py-2.5 text-sm text-info"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.8}
            stroke="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <span>{t("auth.mockModeNotice")}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="form-control w-full">
          <span className="label-text mb-1.5 font-medium">{t("auth.email")}</span>
          <input
            type="email"
            className="input input-bordered w-full focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="name@example.com"
            required
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1.5 font-medium">
            {t("auth.password")}
          </span>
          <input
            type="password"
            className="input input-bordered w-full focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </label>

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
          className="btn btn-primary mt-2 w-full"
          disabled={isAuthenticating}
        >
          {isAuthenticating && (
            <span className="loading loading-spinner loading-sm" />
          )}
          {isAuthenticating ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>
    </div>
  );
}
