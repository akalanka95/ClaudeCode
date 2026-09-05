import { Navigate, Outlet } from "react-router-dom";
import { logout, useCurrentUser } from "../../hooks/useAuth";
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

  return (
    <>
      <button
        onClick={logout}
        className="fixed right-3 top-3 z-50 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm hover:bg-slate-50"
      >
        Log out
      </button>
      <Outlet />
    </>
  );
}
