import { LoginForm } from "./LoginForm";

export function LoginPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <LoginForm />
    </div>
  );
}
