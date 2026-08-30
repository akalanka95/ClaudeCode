import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRootBoard } from "../api/boards";

export function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    getRootBoard().then((root) => navigate(`/board/${root.boardId}`, { replace: true }));
  }, [navigate]);

  return <div className="p-4 text-slate-500">Loading...</div>;
}
