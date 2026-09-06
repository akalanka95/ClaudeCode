import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useAuth";
import { getStoredToken } from "../../api/authToken";
import { LoadingScreen } from "./LoadingScreen";

export function RequireAuth() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (!getStoredToken()) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
