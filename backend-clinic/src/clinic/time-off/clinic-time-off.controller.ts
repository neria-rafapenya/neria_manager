import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import { requireClinicAuth, requireClinicRole } from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicTimeOffService } from "./clinic-time-off.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow/staff/time-off")
@UseGuards(ClinicAuthGuard)
export class ClinicTimeOffController {
  constructor(private readonly timeOff: ClinicTimeOffService) {}

  @Get()
  list(@Req() req: AuthRequest, @Query("from") from?: string, @Query("to") to?: string) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.timeOff.list(user.tenantId, from, to);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() body: any) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.timeOff.create(user.tenantId, body || {});
  }

  @Delete(":id")
  remove(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.timeOff.delete(user.tenantId, id);
  }
}
