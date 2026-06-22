export interface AuthUser {
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthClient {
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  /** 現在の有効な ID トークン（API 認可用）。未認証/モック時は null。 */
  getToken: () => Promise<string | null>;
}
