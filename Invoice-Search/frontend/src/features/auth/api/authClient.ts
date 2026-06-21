import { createCognitoAuthClient } from "./cognitoAuthClient";
import { createMockAuthClient } from "./mockAuthClient";
import type { AuthClient } from "../types";

function buildAuthClient(): AuthClient {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

  if (userPoolId && clientId) {
    return createCognitoAuthClient({ userPoolId, clientId });
  }

  return createMockAuthClient();
}

export const isMockAuthMode = (): boolean =>
  !import.meta.env.VITE_COGNITO_USER_POOL_ID || !import.meta.env.VITE_COGNITO_CLIENT_ID;

export const authClient: AuthClient = buildAuthClient();
