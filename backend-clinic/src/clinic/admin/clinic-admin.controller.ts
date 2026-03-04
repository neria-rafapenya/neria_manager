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
import { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import {
  ClinicJwtPayload,
  requireClinicAuth,
  requireClinicRole,
} from "../auth/clinic-auth.utils";
import { ClinicUserService } from "../clinic-user.service";

@Controller("/clinicflow/admin")
@UseGuards(ClinicAuthGuard)
export class ClinicAdminController {
  constructor(private readonly userService: ClinicUserService) {}

  private getManager(req: Request) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager");
    return user;
  }

  @Get("/users")
  listUsers(@Req() req: Request) {
    const user = this.getManager(req);
    return this.userService.list(user.tenantId);
  }

  @Post("/users")
  createUser(@Req() req: Request, @Body() body: any) {
    const user = this.getManager(req);
    return this.userService.create(user.tenantId, body || {});
  }

  @Patch("/users/:id")
  updateUser(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getManager(req);
    return this.userService.update(user.tenantId, id, body || {});
  }

  @Post("/users/:id/reset-password")
  resetPassword(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getManager(req);
    return this.userService.resetPassword(user.tenantId, id, body || {});
  }

  @Delete("/users/:id")
  deleteUser(@Req() req: Request, @Param("id") id: string) {
    const user = this.getManager(req);
    return this.userService.delete(user.tenantId, id);
  }
}
