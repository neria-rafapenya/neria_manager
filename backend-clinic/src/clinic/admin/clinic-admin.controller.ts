import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import {
  requireClinicAuth,
  requireClinicRole,
} from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicUserService } from "../clinic-user.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow/admin")
@UseGuards(ClinicAuthGuard)
export class ClinicAdminController {
  constructor(private readonly userService: ClinicUserService) {}

  private getManager(req: AuthRequest) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager");
    return user;
  }

  @Get("/users")
  listUsers(@Req() req: AuthRequest) {
    const user = this.getManager(req);
    return this.userService.list(user.tenantId);
  }

  @Post("/users")
  createUser(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getManager(req);
    return this.userService.create(user.tenantId, body || {});
  }

  @Patch("/users/:id")
  updateUser(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getManager(req);
    return this.userService.update(user.tenantId, id, body || {});
  }

  @Post("/users/:id/reset-password")
  resetPassword(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getManager(req);
    return this.userService.resetPassword(user.tenantId, id, body || {});
  }

  @Delete("/users/:id")
  deleteUser(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = this.getManager(req);
    return this.userService.delete(user.tenantId, id);
  }
}
