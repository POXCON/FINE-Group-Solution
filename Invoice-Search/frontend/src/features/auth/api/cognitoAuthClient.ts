import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import type { AuthClient, AuthUser, LoginCredentials } from "../types";

interface CognitoConfig {
  userPoolId: string;
  clientId: string;
}

export function createCognitoAuthClient(config: CognitoConfig): AuthClient {
  const userPool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });

  const login = ({ email, password }: LoginCredentials): Promise<AuthUser> =>
    new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: () => resolve({ email }),
        onFailure: (error: unknown) => reject(error),
      });
    });

  const logout = (): Promise<void> =>
    new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
      resolve();
    });

  const getCurrentUser = (): Promise<AuthUser | null> =>
    new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }
      cognitoUser.getSession((error: unknown, session: { isValid: () => boolean } | null) => {
        if (error || !session?.isValid()) {
          resolve(null);
          return;
        }
        resolve({ email: cognitoUser.getUsername() });
      });
    });

  type CognitoSession = {
    isValid: () => boolean;
    getIdToken: () => { getJwtToken: () => string };
  };

  const getToken = (): Promise<string | null> =>
    new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }
      cognitoUser.getSession((error: unknown, session: CognitoSession | null) => {
        if (error || !session?.isValid()) {
          resolve(null);
          return;
        }
        // バックエンドは aud=App Client ID を検証するため ID トークンを送る。
        resolve(session.getIdToken().getJwtToken());
      });
    });

  return { login, logout, getCurrentUser, getToken };
}
