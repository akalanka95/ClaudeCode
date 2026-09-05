import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as searchApi from "../api/search";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const trimmed = debouncedQuery.trim();

  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => searchApi.search(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
  });
}
