export type OAuthState = {
  tenantId?: string;
};

export const encodeState = (state: OAuthState): string => {
  const json = JSON.stringify(state);
  return Buffer.from(json)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const decodeState = (state?: string | string[]): OAuthState | null => {
  if (!state) return null;
  const value = Array.isArray(state) ? state[0] : state;
  if (!value) return null;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  const padded =
    padding === 0 ? base64 : base64 + "=".repeat(4 - padding);
  try {
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as OAuthState;
  } catch {
    return null;
  }
};
