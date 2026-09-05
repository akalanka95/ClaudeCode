import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleLoginUrl } from "../api/auth";
import { useLogin } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { username, password },
      { onSuccess: () => navigate("/", { replace: true }) },
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-[min(22rem,90vw)] rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-medium text-slate-800">Sign in</h1>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            autoFocus
            className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {login.isError && (
            <p className="text-sm text-red-600">Invalid username or password.</p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {login.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          or
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <a
          href={googleLoginUrl}
          className="flex items-center justify-center rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
