import { AuthResponse } from "../types/auth";

const SESSION_KEY = "presupuestos_session";
const ACCESS_TOKEN_COOKIE = "presup_access_token";
const SESSION_EXPIRED_KEY = "presupuestos_session_expired";

export interface SessionData extends Omit<AuthResponse, "token"> {
  token?: string;
}

interface JwtPayload {
  exp?: number;
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const tokenCookie = cookies.find((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  if (!tokenCookie) return null;
  return decodeURIComponent(tokenCookie.split("=")[1] ?? "");
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

export function loadSession(): SessionData | null {
  const raw = localStorage.getItem(SESSION_KEY);
  const token = getAccessToken();
  if (!raw || !token) return null;
  try {
    const parsed = JSON.parse(raw) as SessionData;
    return { ...parsed, token };
  } catch {
    return null;
  }
}

export function saveSession(session: AuthResponse) {
  setCookie(ACCESS_TOKEN_COOKIE, session.token);
  const { token, ...rest } = session;
  localStorage.setItem(SESSION_KEY, JSON.stringify(rest));
}

export function clearSession() {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  localStorage.removeItem(SESSION_KEY);
}

export function markSessionExpired() {
  localStorage.setItem(SESSION_EXPIRED_KEY, "1");
}

export function consumeSessionExpired(): boolean {
  const value = localStorage.getItem(SESSION_EXPIRED_KEY);
  if (value) {
    localStorage.removeItem(SESSION_EXPIRED_KEY);
    return true;
  }
  return false;
}
