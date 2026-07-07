export interface AuthUser {
  email: string;
  name?: string;
  /**
   * Entra ID アクセス／ID トークンの `roles` クレーム（App Roles）。
   * 認可（`admin` 判定）に用いる。Cognito の `cognito:groups` からの移行。
   */
  readonly roles: readonly string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthClient {
  /**
   * サインインを開始する。MSAL では SSO サイレントで、モック実装では
   * 資格情報を検証する。自前ログイン画面は廃止済みのため通常フローでは
   * 呼ばれない（ポータル SSO を利用）。
   */
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  /** 現在の有効なアクセストークン（API 認可用）。未認証／取得不可時は null。 */
  getToken: () => Promise<string | null>;
}
