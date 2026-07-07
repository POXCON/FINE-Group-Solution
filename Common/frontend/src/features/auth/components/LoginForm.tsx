import { isMockAuthMode } from "../api/authClient";
import { MockLoginForm } from "./MockLoginForm";
import { EntraLoginPanel } from "./EntraLoginPanel";

/**
 * ログイン画面のフォーム。
 * - Entra (MSAL) 構成時 : Microsoft サインインへリダイレクトするパネルを表示。
 * - 未設定（モック）時   : 開発用のメール／パスワードフォームを表示。
 */
export function LoginForm(): React.JSX.Element {
  return isMockAuthMode() ? <MockLoginForm /> : <EntraLoginPanel />;
}
