import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authClient } from "../api/authClient";
import { AuthContext } from "../hooks/useAuthContext";
import { getErrorMessage } from "@/shared/lib/errors";
import type { AuthUser, LoginOptions } from "../types";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    authClient
      .getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsInitializing(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (options: LoginOptions): Promise<void> => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const authenticatedUser = await authClient.login(options);
        setUser(authenticatedUser);
      } catch (loginError: unknown) {
        setError(getErrorMessage(loginError));
        throw loginError;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    await authClient.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isInitializing, isAuthenticating, error, login, logout }),
    [user, isInitializing, isAuthenticating, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
