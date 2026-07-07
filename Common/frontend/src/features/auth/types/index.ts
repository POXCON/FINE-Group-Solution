export interface AuthUser {
  email: string;
  name?: string;
  /** ID トークンの `roles` クレーム（Entra App Roles）。ロール判定に用いる。 */
  roles: string[];
}

export interface LoginOptions {
  /** ON=localStorage（永続）/ OFF=sessionStorage（ブラウザ閉で消去）。 */
  rememberMe: boolean;
  /** モック認証のみで使用（MSAL はリダイレクト方式のため不要）。 */
  email?: string;
  /** モック認証のみで使用（MSAL はリダイレクト方式のため不要）。 */
  password?: string;
}

export interface AuthClient {
  login: (options: LoginOptions) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  /** 現在の有効なアクセストークン（API 認可用）。未認証/モック時は null。 */
  getToken: () => Promise<string | null>;
}
