import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import {
  ClinicJwtPayload,
  requireClinicAuth,
  requireClinicRole,
} from "../auth/clinic-auth.utils";
import { ClinicPatientService } from "../clinic-patient.service";
import { ClinicUserService } from "../clinic-user.service";

@Controller("/clinicflow/patient")
@UseGuards(ClinicAuthGuard)
export class ClinicPatientController {
  constructor(
    private readonly patientService: ClinicPatientService,
    private readonly userService: ClinicUserService,
  ) {}

  private getPatient(req: Request): ClinicJwtPayload {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "patient");
    return user;
  }

  @Get("/summary")
  async summary(@Req() req: Request) {
    const user = this.getPatient(req);
    const clinicUser = await this.userService.getById(user.tenantId, user.sub);
    const appointments = await this.patientService.listAppointments(user.tenantId, user.sub);
    const documents = await this.patientService.listDocuments(user.tenantId, user.sub);
    const treatments = await this.patientService.listTreatments(user.tenantId, user.sub);
    const interactions = await this.patientService.listInteractions(user.tenantId, user.sub);
    return { user: clinicUser, appointments, documents, treatments, interactions };
  }

  @Get("/appointments")
  listAppointments(@Req() req: Request) {
    const user = this.getPatient(req);
    return this.patientService.listAppointments(user.tenantId, user.sub);
  }

  @Get("/documents")
  listDocuments(@Req() req: Request) {
    const user = this.getPatient(req);
    return this.patientService.listDocuments(user.tenantId, user.sub);
  }

  @Get("/treatments")
  listTreatments(@Req() req: Request) {
    const user = this.getPatient(req);
    return this.patientService.listTreatments(user.tenantId, user.sub);
  }

  @Get("/interactions")
  listInteractions(@Req() req: Request) {
    const user = this.getPatient(req);
    return this.patientService.listInteractions(user.tenantId, user.sub);
  }

  @Post("/interactions")
  createInteraction(@Req() req: Request, @Body() body: any) {
    const user = this.getPatient(req);
    return this.patientService.createInteraction(user.tenantId, user.sub, body || {});
  }

  @Post("/appointments/:id/request-change")
  requestChange(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getPatient(req);
    const message = body?.message || "";
    return this.patientService.createInteraction(user.tenantId, user.sub, {
      title: "Solicitud de cambio de cita",
      type: "appointment_change",
      status: "requested",
      summary: message,
      metadata: { appointmentId: id },
    });
  }

  @Post("/appointments/:id/request-cancel")
  requestCancel(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getPatient(req);
    const message = body?.message || "";
    return this.patientService.createInteraction(user.tenantId, user.sub, {
      title: "Solicitud de cancelación",
      type: "appointment_cancel",
      status: "requested",
      summary: message,
      metadata: { appointmentId: id },
    });
  }
}
