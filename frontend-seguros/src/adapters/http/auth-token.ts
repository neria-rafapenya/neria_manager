const AUTH_TOKEN_KEY = "claimsflow_token";

export function readAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function writeAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

