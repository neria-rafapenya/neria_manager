import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import { requireClinicAuth, requireClinicRole } from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicHolidaysService } from "./clinic-holidays.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow/staff/holidays")
@UseGuards(ClinicAuthGuard)
export class ClinicHolidaysController {
  constructor(private readonly holidays: ClinicHolidaysService) {}

  @Get()
  list(@Req() req: AuthRequest, @Query("from") from?: string, @Query("to") to?: string) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff", "assistant");
    return this.holidays.list(user.tenantId, from, to);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() body: any) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff", "assistant");
    return this.holidays.create(user.tenantId, body || {});
  }

  @Delete("/:id")
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.holidays.delete(user.tenantId, id);
  }
}
