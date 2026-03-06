import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { ClinicAuthService } from "./clinic-auth.service";
import { GoogleAuthGuard } from "./google-auth.guard";
import { FacebookAuthGuard } from "./facebook-auth.guard";
import { decodeState } from "./oauth.utils";

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
  name?: string;
}

@Controller("/clinicflow/auth")
export class ClinicAuthController {
  constructor(
    private readonly authService: ClinicAuthService,
    private readonly config: ConfigService,
  ) {}

  private renderPopup(res: Response, payload: { type: string; data?: any }) {
    const origin = this.config.get<string>("OAUTH_FRONTEND_ORIGIN", "*");
    const safeOrigin = origin || "*";
    const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      (function() {
        var payload = ${JSON.stringify(payload)};
        if (window.opener) {
          window.opener.postMessage(payload, ${JSON.stringify(safeOrigin)});
        }
        window.close();
      })();
    </script>
  </body>
</html>`;
    return res.type("text/html").send(html);
  }

  private getState(req: Request) {
    return req.query?.state as string | string[] | undefined;
  }

  @Post("/login")
  async login(@Headers("x-tenant-id") headerTenant: string, @Body() body: LoginRequest) {
    const tenantId = headerTenant || body?.tenantId;
    if (!tenantId) {
      throw new BadRequestException("Missing tenant");
    }
    if (!body?.email || !body?.password) {
      throw new BadRequestException("Email and password required");
    }
    return this.authService.login(tenantId, body.email.trim().toLowerCase(), body.password);
  }

  @Post("/register")
  async register(@Headers("x-tenant-id") headerTenant: string, @Body() body: LoginRequest) {
    const tenantId = headerTenant || body?.tenantId;
    if (!tenantId) {
      throw new BadRequestException("Missing tenant");
    }
    if (!body?.email || !body?.password) {
      throw new BadRequestException("Email and password required");
    }
    return this.authService.register(
      tenantId,
      body.email.trim().toLowerCase(),
      body.password,
      body.name,
    );
  }

  @Get("/google")
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return;
  }

  @Get("/google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const decoded = decodeState(this.getState(req));
      const tenantId = decoded?.tenantId || (req.query?.tenantId as string);
      if (!tenantId) {
        throw new Error("Missing tenant");
      }
      const user = (req as Request & { user?: any }).user as any;
      const auth = await this.authService.socialLogin(
        tenantId,
        user?.email,
        user?.name,
      );
      return this.renderPopup(res, {
        type: "clinicflow:auth-success",
        data: auth,
      });
    } catch (err: any) {
      return this.renderPopup(res, {
        type: "clinicflow:auth-error",
        data: { message: err?.message || "OAuth error" },
      });
    }
  }

  @Get("/facebook")
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    return;
  }

  @Get("/facebook/callback")
  @UseGuards(FacebookAuthGuard)
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const decoded = decodeState(this.getState(req));
      const tenantId = decoded?.tenantId || (req.query?.tenantId as string);
      if (!tenantId) {
        throw new Error("Missing tenant");
      }
      const user = (req as Request & { user?: any }).user as any;
      const auth = await this.authService.socialLogin(
        tenantId,
        user?.email,
        user?.name,
      );
      return this.renderPopup(res, {
        type: "clinicflow:auth-success",
        data: auth,
      });
    } catch (err: any) {
      return this.renderPopup(res, {
        type: "clinicflow:auth-error",
        data: { message: err?.message || "OAuth error" },
      });
    }
  }
}
