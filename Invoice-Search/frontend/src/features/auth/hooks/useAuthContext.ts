import { createContext, useContext } from "react";
import type { AuthUser, LoginCredentials } from "../types";

export interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  isAuthenticating: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
