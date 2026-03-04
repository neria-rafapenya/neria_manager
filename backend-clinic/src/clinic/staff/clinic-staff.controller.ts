import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ClinicPatientService } from "../clinic-patient.service";
import { ClinicUserService } from "../clinic-user.service";

@Controller("/clinicflow/staff")
@UseGuards(ClinicAuthGuard)
export class ClinicStaffController {
  constructor(
    private readonly patientService: ClinicPatientService,
    private readonly userService: ClinicUserService,
  ) {}

  private getStaff(req: Request, roles: string[] = ["manager", "staff", "assistant"]) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, ...roles);
    return user;
  }

  @Get("/patients")
  listPatients(@Req() req: Request) {
    const user = this.getStaff(req);
    return this.userService.listPatients(user.tenantId);
  }

  @Get("/appointments")
  listAppointments(@Req() req: Request, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return this.patientService.listAppointmentsAll(user.tenantId);
    }
    return this.patientService.listAppointments(user.tenantId, patientUserId);
  }

  @Post("/appointments")
  createAppointment(@Req() req: Request, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.createAppointment(user.tenantId, body || {});
  }

  @Patch("/appointments/:id")
  updateAppointment(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.updateAppointment(user.tenantId, id, body || {});
  }

  @Delete("/appointments/:id")
  deleteAppointment(@Req() req: Request, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.deleteAppointment(user.tenantId, id);
  }

  @Get("/documents")
  listDocuments(@Req() req: Request, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return this.patientService.listDocumentsAll(user.tenantId);
    }
    return this.patientService.listDocuments(user.tenantId, patientUserId);
  }

  @Post("/documents")
  createDocument(@Req() req: Request, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.createDocument(user.tenantId, body || {});
  }

  @Patch("/documents/:id")
  updateDocument(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.updateDocument(user.tenantId, id, body || {});
  }

  @Delete("/documents/:id")
  deleteDocument(@Req() req: Request, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.deleteDocument(user.tenantId, id);
  }

  @Get("/treatments")
  listTreatments(@Req() req: Request, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return this.patientService.listTreatmentsAll(user.tenantId);
    }
    return this.patientService.listTreatments(user.tenantId, patientUserId);
  }

  @Post("/treatments")
  createTreatment(@Req() req: Request, @Body() body: any) {
    const user = this.getStaff(req, ["manager"]);
    return this.patientService.createTreatment(user.tenantId, body || {});
  }

  @Patch("/treatments/:id")
  updateTreatment(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager"]);
    return this.patientService.updateTreatment(user.tenantId, id, body || {});
  }

  @Delete("/treatments/:id")
  deleteTreatment(@Req() req: Request, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager"]);
    return this.patientService.deleteTreatment(user.tenantId, id);
  }

  @Get("/interactions")
  listInteractions(@Req() req: Request, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return [];
    }
    return this.patientService.listInteractions(user.tenantId, patientUserId);
  }

  @Post("/interactions")
  createInteraction(@Req() req: Request, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    if (!body?.patientUserId) {
      throw new BadRequestException("Missing patientUserId");
    }
    return this.patientService.createInteraction(user.tenantId, body.patientUserId, body || {});
  }
}
