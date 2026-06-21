export interface AuthUser {
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthClient {
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
}
