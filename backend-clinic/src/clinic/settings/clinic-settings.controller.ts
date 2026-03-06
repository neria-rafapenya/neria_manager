import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import { requireClinicAuth, requireClinicRole } from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicSettingsService } from "./clinic-settings.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow")
@UseGuards(ClinicAuthGuard)
export class ClinicSettingsController {
  constructor(private readonly settingsService: ClinicSettingsService) {}

  private getUser(req: AuthRequest): ClinicJwtPayload {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    return user;
  }

  @Get("/settings")
  getSettings(@Req() req: AuthRequest) {
    const user = this.getUser(req);
    return this.settingsService.getSettings(user.tenantId);
  }

  @Put("/settings")
  updateSettings(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getUser(req);
    return this.settingsService.updateSettings(user.tenantId, body || {});
  }

  @Get("/services")
  listServices(@Req() req: AuthRequest) {
    const user = this.getUser(req);
    return this.settingsService.listServices(user.tenantId);
  }

  @Get("/protocols")
  listProtocols(@Req() req: AuthRequest) {
    const user = this.getUser(req);
    return this.settingsService.listProtocols(user.tenantId);
  }

  @Get("/faq")
  listFaq(@Req() req: AuthRequest) {
    const user = this.getUser(req);
    return this.settingsService.listFaq(user.tenantId);
  }

  @Get("/triage")
  listTriage(@Req() req: AuthRequest) {
    const user = this.getUser(req);
    return this.settingsService.listTriage(user.tenantId);
  }

  @Get("/reports")
  listReports(@Req() req: AuthRequest) {
    const user = this.getUser(req);
    return this.settingsService.listReports(user.tenantId);
  }
}
