import { apiClient } from "./client";
import type { AuthResponse, CurrentUserResponse, LoginRequest } from "../types/api";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", request);
  return data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await apiClient.get<CurrentUserResponse>("/auth/me");
  return data;
}

/** The backend's origin (no `/api/v1` suffix) — Spring Security's OAuth2 endpoints live there. */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1").replace(
  /\/api\/v1\/?$/,
  "",
);

export const googleLoginUrl = `${API_ORIGIN}/oauth2/authorization/google`;
