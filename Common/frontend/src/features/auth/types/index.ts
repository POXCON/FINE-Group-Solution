export interface AuthUser {
  email: string;
  name?: string;
  /** ID トークンの cognito:groups。ロール判定に用いる。 */
  groups: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  /** ON=localStorage（永続）/ OFF=sessionStorage（ブラウザ閉で消去）。 */
  rememberMe: boolean;
}

export interface AuthClient {
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  /** 現在の有効な ID トークン（API 認可用）。未認証/モック時は null。 */
  getToken: () => Promise<string | null>;
}
