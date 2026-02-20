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

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const headerToken = extractBearer(request.headers.authorization);
    const chatHeader = request.headers["x-chat-token"];
    const chatToken =
      typeof chatHeader === "string"
        ? chatHeader
        : Array.isArray(chatHeader)
          ? chatHeader[0]
          : null;

    let token = headerToken || (chatToken ? chatToken.trim() : null);
    if (!token && request.headers.cookie) {
      const cookies = parseCookie(request.headers.cookie);
      token = cookies[TOKEN_COOKIE] || null;
    }

    if (!token) {
      throw new UnauthorizedException("Missing bearer token or x-chat-token");
    }

    const secret = process.env.AUTH_JWT_SECRET || "";
    if (!secret) {
      throw new UnauthorizedException("JWT secret not configured");
    }

    try {
      const payload = jwt.verify(token, secret);
      (request as any).auth = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
