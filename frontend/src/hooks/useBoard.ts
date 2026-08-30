import { useQuery } from "@tanstack/react-query";
import { getBoard } from "../api/boards";

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId as string),
    enabled: Boolean(boardId),
  });
}
