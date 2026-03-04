import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const envFiles = [".env.local", ".env"];

const parseEnvFile = (filePath) => {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }
    result[key] = value;
  }
  return result;
};

let merged = {};
for (const filename of envFiles) {
  const filePath = resolve(cwd, filename);
  const data = parseEnvFile(filePath);
  merged = { ...merged, ...data };
}

const envPayload = {
  VITE_API_BASE_URL: merged.VITE_API_BASE_URL || "",
  VITE_API_KEY: merged.VITE_API_KEY || "",
  VITE_TENANT_ID: merged.VITE_TENANT_ID || "",
  VITE_SERVICE_CODE: merged.VITE_SERVICE_CODE || "",
  VITE_SERVICE_ID: merged.VITE_SERVICE_ID || "",
  VITE_DEBUG_AUTH: merged.VITE_DEBUG_AUTH || "",
  VITE_CLINICFLOW_API_BASE_URL: merged.VITE_CLINICFLOW_API_BASE_URL || "",
  VITE_CLINICFLOW_ENDPOINTS: merged.VITE_CLINICFLOW_ENDPOINTS || "",
};

const outPath = resolve(cwd, "public", "env.js");
const js = `window.__ENV__ = ${JSON.stringify(envPayload, null, 2)};\n`;
writeFileSync(outPath, js, "utf8");
console.log(`[env] wrote ${outPath}`);
