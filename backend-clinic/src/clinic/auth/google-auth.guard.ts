import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { encodeState } from "./oauth.utils";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  getAuthenticateOptions(context: any) {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.query?.tenantId || req.headers["x-tenant-id"];
    const state = tenantId ? encodeState({ tenantId }) : undefined;
    return {
      scope: ["profile", "email"],
      state,
    };
  }
}
