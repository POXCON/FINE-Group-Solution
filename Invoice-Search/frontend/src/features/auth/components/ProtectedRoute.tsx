import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { useTranslation } from "react-i18next";

/** 未認証時に遷移するポータル（同一オリジンのルート）。 */
const PORTAL_URL = "/";

/**
 * 認証ガード。
 *
 * - 初期化中: ローディング表示。
 * - 未認証: 自前ログイン画面は廃止したため、ポータル（`/`）へ
 *   全画面リダイレクトし、ポータルの Cognito セッション（SSO）でログインさせる。
 * - 認証済み: 子ルートを描画。
 */
export function ProtectedRoute(): React.JSX.Element | null {
  const { user, isInitializing } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isInitializing && !user) {
      window.location.href = PORTAL_URL;
    }
  }, [isInitializing, user]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label={t("common.loading")} />
      </div>
    );
  }

  if (!user) {
    // リダイレクト実行中はコンテンツを描画しない。
    return null;
  }

  return <Outlet />;
}
