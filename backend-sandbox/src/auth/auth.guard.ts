import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { parse as parseCookie } from "cookie";

const TOKEN_COOKIE = "ia_chat_access_token";

const extractBearer = (headerValue: string | undefined): string | null => {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim();
};

const extractTokenFromHeader = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().startsWith("bearer ") ) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
};

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers["x-api-key"];
    const apiKey =
      typeof apiKeyHeader === "string"
        ? apiKeyHeader
        : Array.isArray(apiKeyHeader)
          ? apiKeyHeader[0]
          : null;

    const headerCandidates = new Set<string>(["authorization", "x-chat-token"]);
    const extraHeaders = process.env.AUTH_TOKEN_HEADERS;
    if (extraHeaders) {
      extraHeaders.split(",").forEach((name) => {
        const trimmed = name.trim();
        if (trimmed) headerCandidates.add(trimmed.toLowerCase());
      });
    }

    let token: string | null = null;
    for (const name of headerCandidates) {
      const headerValue = request.headers[name as keyof typeof request.headers];
      const value =
        typeof headerValue === "string"
          ? headerValue
          : Array.isArray(headerValue)
            ? headerValue[0]
            : undefined;
      const extracted = extractTokenFromHeader(value);
      if (extracted) {
        token = extracted;
        break;
      }
    }

    if (!token && request.headers.cookie) {
      const cookies = parseCookie(request.headers.cookie);
      token = cookies[TOKEN_COOKIE] || null;
      const extraCookies = process.env.AUTH_TOKEN_COOKIES;
      if (!token && extraCookies) {
        for (const name of extraCookies.split(",")) {
          const trimmed = name.trim();
          if (!trimmed) continue;
          const value = cookies[trimmed];
          if (value) {
            token = value;
            break;
          }
        }
      }
    }

    if (!token && apiKey) {
      (request as any).auth = { apiKey };
      return true;
    }

    if (!token) {
      throw new UnauthorizedException("Missing bearer token, x-chat-token or x-api-key");
    }

    const authSecret = process.env.AUTH_JWT_SECRET || "";
    const chatSecret = process.env.CHAT_JWT_SECRET || "";
    const secrets = [authSecret, chatSecret].filter(Boolean);
    if (secrets.length == 0) {
      throw new UnauthorizedException("JWT secret not configured");
    }

    for (const secret of secrets) {
      try {
        const payload = jwt.verify(token, secret);
        (request as any).auth = payload;
        return true;
      } catch {
        // try next secret
      }
    }

    if (apiKey) {
      (request as any).auth = { apiKey };
      return true;
    }

    throw new UnauthorizedException("Invalid token");
  }
}
