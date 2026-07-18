import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { useAppStore } from "../store/useAppStore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AuthPage({ isLogin = true }: { isLogin?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setAuth(data.token, data.user);
      navigate("/workspace");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="w-full max-w-md bg-surface border border-outline-variant rounded-2xl p-xl shadow-2xl">
          <div className="text-center mb-xl">
            <h1 className="font-display-lg text-headline-md font-bold text-on-surface mb-sm">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="font-body-md text-on-surface-variant">
              {isLogin 
                ? "Enter your credentials to access your workspace." 
                : "Sign up to start compiling and executing code in the cloud."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {error && (
              <div className="bg-error/10 text-error p-sm rounded-lg text-center font-body-md">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface-variant" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="bg-surface-container border border-outline-variant rounded-lg p-sm text-on-surface font-body-md focus:border-primary focus:outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface-variant" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="bg-surface-container border border-outline-variant rounded-lg p-sm text-on-surface font-body-md focus:border-primary focus:outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-md w-full bg-primary text-on-primary py-sm rounded-lg font-label-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-xl text-center font-body-md text-on-surface-variant">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => navigate(isLogin ? "/signup" : "/login")}
              className="text-primary hover:underline font-bold"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
