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
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFieldError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(t("auth.invalidCredentials"));
      return;
    }

    try {
      await login(parsed.data);
      const state = location.state as LocationState | null;
      const redirectTo = state?.from?.pathname ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      setFieldError(getErrorMessage(error));
    }
  };

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-xl">
      <div className="card-body">
        <h1 className="card-title justify-center text-2xl">{t("auth.loginTitle")}</h1>

        {isMockAuthMode() && (
          <div role="status" className="alert alert-info text-sm">
            {t("auth.mockModeNotice")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <label className="form-control">
            <span className="label-text">{t("auth.email")}</span>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text">{t("auth.password")}</span>
            <input
              type="password"
              className="input input-bordered w-full"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {fieldError && (
            <p role="alert" className="text-error text-sm">
              {fieldError}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={isAuthenticating}>
            {isAuthenticating ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
