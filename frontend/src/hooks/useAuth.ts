import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login } from "../api/auth";
import { clearStoredToken, getStoredToken, setStoredToken } from "../api/authToken";
import type { LoginRequest } from "../types/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled: Boolean(getStoredToken()),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (data) => {
      setStoredToken(data.token);
      queryClient.setQueryData(["currentUser"], data.user);
    },
  });
}

export function logout(): void {
  clearStoredToken();
  window.location.assign("/login");
}
