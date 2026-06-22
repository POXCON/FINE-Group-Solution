import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { useTranslation } from "react-i18next";
import { isAdmin } from "../lib/roles";

/** 未認証・非管理者時に遷移するポータル（同一オリジンのルート）。 */
const PORTAL_URL = "/";

/**
 * 認証＋認可ガード（多層防御）。
 *
 * - 初期化中: ローディング表示。
 * - 未認証: 自前ログイン画面は廃止したため、ポータル（`/`）へ
 *   全画面リダイレクトし、ポータルの Cognito セッション（SSO）でログインさせる。
 * - 認証済みだが `fine-admin` 非所属（店舗ユーザー等）: Invoice-Search は
 *   管理者専用のため、ポータル（`/`）へ全画面リダイレクトする。
 * - 認証済みかつ管理者: 子ルートを描画。
 */
export function ProtectedRoute(): React.JSX.Element | null {
  const { user, isInitializing } = useAuth();
  const { t } = useTranslation();

  const isAuthorized = isAdmin(user);

  useEffect(() => {
    if (!isInitializing && !isAuthorized) {
      window.location.href = PORTAL_URL;
    }
  }, [isInitializing, isAuthorized]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label={t("common.loading")} />
      </div>
    );
  }

  if (!isAuthorized) {
    // リダイレクト実行中はコンテンツを描画しない（未認証・非管理者の双方）。
    return null;
  }

  return <Outlet />;
}
