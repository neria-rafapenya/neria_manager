import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../../../../domain/services/auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers?.authorization as string | undefined;

    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token requerido");
    }

    const token = header.slice(7);
    try {
      request.user = this.authService.verifyToken(token);
      return true;
    } catch {
      throw new UnauthorizedException("Token invalido");
    }
  }
}
