import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import type { AuthClient, AuthUser, LoginCredentials } from "../types";
import { normalizeGroups } from "../lib/roles";
import {
  persistPreference,
  readPreference,
  resolveStorage,
  storageKindFor,
} from "../lib/authStorage";
import type { StorageKind } from "../lib/authStorage";

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

function userFromPayload(payload: IdTokenPayload, fallbackEmail: string): AuthUser {
  return {
    email: payload.email ?? fallbackEmail,
    name: payload.name,
    groups: normalizeGroups(payload["cognito:groups"]),
  };
}

export function createCognitoAuthClient(config: CognitoConfig): AuthClient {
  const buildPool = (kind: StorageKind): CognitoUserPool =>
    new CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId,
      Storage: resolveStorage(kind),
    });

  // アプリ初期化時は保存済み preference のストレージで pool を再現する。
  let userPool = buildPool(readPreference());

  const login = ({
    email,
    password,
    rememberMe,
  }: LoginCredentials): Promise<AuthUser> =>
    new Promise((resolve, reject) => {
      // 選択したストレージで pool を再構築し、以降の getCurrentUser/getToken も尊重させる。
      const kind = storageKindFor(rememberMe);
      persistPreference(kind);
      userPool = buildPool(kind);

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoSession) => {
          resolve(userFromPayload(session.getIdToken().decodePayload(), email));
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
        resolve(
          userFromPayload(
            session.getIdToken().decodePayload(),
            cognitoUser.getUsername(),
          ),
        );
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
