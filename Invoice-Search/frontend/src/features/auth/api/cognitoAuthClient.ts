import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import type { AuthClient, AuthUser, LoginCredentials } from "../types";
import { clearPreference, readPreference, resolveStorage } from "../lib/authStorage";
import { normalizeGroups } from "../lib/roles";

interface CognitoConfig {
  userPoolId: string;
  clientId: string;
}

interface IdTokenPayload {
  email?: string;
  name?: string;
  "cognito:groups"?: unknown;
}

type CognitoSession = {
  isValid: () => boolean;
  getIdToken: () => {
    getJwtToken: () => string;
    decodePayload: () => IdTokenPayload;
  };
};

export function createCognitoAuthClient(config: CognitoConfig): AuthClient {
  // ポータルが選択したストレージ（fine-portal.remember）と同じストレージで
  // pool を構築し、同一 clientId・同一プールが作成したセッションを共有する（SSO）。
  const userPool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
    Storage: resolveStorage(readPreference()),
  });

  const login = ({ email, password }: LoginCredentials): Promise<AuthUser> =>
    new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoSession) => {
          const payload = session.getIdToken().decodePayload();
          resolve({
            email: payload.email ?? email,
            name: payload.name,
            groups: normalizeGroups(payload["cognito:groups"]),
          });
        },
        onFailure: (error: unknown) => reject(error),
      });
    });

  const logout = (): Promise<void> =>
    new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
      // SSO 共有セッションを確実に消すため、両ストレージの痕跡と
      // ポータルの preference をクリアする。
      clearPreference();
      resolve();
    });

  const getCurrentUser = (): Promise<AuthUser | null> =>
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
        const payload = session.getIdToken().decodePayload();
        resolve({
          email: payload.email ?? cognitoUser.getUsername(),
          name: payload.name,
          groups: normalizeGroups(payload["cognito:groups"]),
        });
      });
    });

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
