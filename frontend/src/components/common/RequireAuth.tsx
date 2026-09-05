import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useAuth";
import { getStoredToken } from "../../api/authToken";

export function RequireAuth() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (!getStoredToken()) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }
  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
