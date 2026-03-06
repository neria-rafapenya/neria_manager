import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import { requireClinicAuth, requireClinicRole } from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicAvailabilityService } from "./clinic-availability.service";
import { ClinicTimeOffService } from "../time-off/clinic-time-off.service";
import { ClinicHolidaysService } from "../holidays/clinic-holidays.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow")
@UseGuards(ClinicAuthGuard)
export class ClinicAvailabilityController {
  constructor(
    private readonly availability: ClinicAvailabilityService,
    private readonly timeOff: ClinicTimeOffService,
    private readonly holidays: ClinicHolidaysService,
  ) {}

  @Get("/staff/availability")
  listStaff(
    @Req() req: AuthRequest,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff", "assistant");
    return this.availability.list(user.tenantId, from, to);
  }

  @Post("/staff/availability")
  createStaff(@Req() req: AuthRequest, @Body() body: any) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.availability.create(user.tenantId, body || {});
  }

  @Delete("/staff/availability/:id")
  deleteStaff(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.availability.delete(user.tenantId, id);
  }

  @Post("/staff/open-window")
  openWindow(@Req() req: AuthRequest, @Body() body: any) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return this.availability.openWindow(user.tenantId, body || {});
  }

  @Get("/patient/availability")
  listPatient(
    @Req() req: AuthRequest,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "patient");
    return this.availability
      .list(user.tenantId, from, to, { includeReserved: false })
      .then((slots) => this.timeOff.filterSlots(user.tenantId, slots))
      .then((slots) => this.holidays.filterSlots(user.tenantId, slots));
  }
}
