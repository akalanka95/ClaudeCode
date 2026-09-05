import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setStoredToken } from "../api/authToken";

export function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (token) {
      setStoredToken(token);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return <div className="p-4 text-slate-500">Signing you in...</div>;
}
