import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRootBoard } from "../api/boards";
import { LoadingScreen } from "../components/common/LoadingScreen";

export function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    getRootBoard().then((root) => navigate(`/board/${root.boardId}`, { replace: true }));
  }, [navigate]);

  return <LoadingScreen />;
}
