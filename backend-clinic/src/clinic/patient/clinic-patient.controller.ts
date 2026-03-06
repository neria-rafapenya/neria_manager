import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import type { Request } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import {
  requireClinicAuth,
  requireClinicRole,
} from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicPatientService } from "../clinic-patient.service";
import { ClinicUserService } from "../clinic-user.service";
import { ClinicVisitChatService } from "./clinic-visit-chat.service";
import { ClinicFaqChatService } from "./clinic-faq-chat.service";
import { ClinicPatientPreferenceService } from "./clinic-patient-preference.service";
import { CloudinaryService } from "../storage/cloudinary.service";
import { ClinicFaqLogService } from "../faq/clinic-faq-log.service";
import { ClinicFaqHandoffService } from "../faq/clinic-faq-handoff.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow/patient")
@UseGuards(ClinicAuthGuard)
export class ClinicPatientController {
  constructor(
    private readonly patientService: ClinicPatientService,
    private readonly userService: ClinicUserService,
    private readonly visitChat: ClinicVisitChatService,
    private readonly faqChat: ClinicFaqChatService,
    private readonly preferenceService: ClinicPatientPreferenceService,
    private readonly faqLogs: ClinicFaqLogService,
    private readonly faqHandoffs: ClinicFaqHandoffService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private getPatient(req: AuthRequest): ClinicJwtPayload {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "patient");
    return user;
  }

  @Get("/summary")
  async summary(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    const clinicUser = await this.userService.getById(user.tenantId, user.sub);
    const appointments = await this.patientService.listAppointments(user.tenantId, user.sub);
    const documents = await this.patientService.listDocuments(user.tenantId, user.sub);
    const treatments = await this.patientService.listTreatments(user.tenantId, user.sub);
    const interactions = await this.patientService.listInteractions(user.tenantId, user.sub);
    return { user: clinicUser, appointments, documents, treatments, interactions };
  }

  @Get("/profile")
  getProfile(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.userService.getById(user.tenantId, user.sub);
  }

  @Patch("/profile")
  updateProfile(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    const payload = {
      name: body?.name,
      email: body?.email,
    };
    return this.userService.update(user.tenantId, user.sub, payload);
  }

  @Post("/password")
  changePassword(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    return this.userService.changePassword(
      user.tenantId,
      user.sub,
      body?.currentPassword,
      body?.newPassword,
    );
  }

  @Post("/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 200 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          cb(new Error("Invalid file type"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = this.getPatient(req);
    if (!file?.buffer) {
      throw new Error("Missing file");
    }
    const url = await this.cloudinary.uploadAvatar(
      file.buffer,
      file.originalname,
      user.tenantId,
      user.sub,
    );
    return this.userService.update(user.tenantId, user.sub, { avatarUrl: url });
  }

  @Get("/appointments")
  listAppointments(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.patientService.listAppointments(user.tenantId, user.sub);
  }

  @Get("/documents")
  listDocuments(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.patientService.listDocuments(user.tenantId, user.sub);
  }
  @Post("/appointments")
  createAppointment(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    const payload = { ...(body || {}), patientUserId: user.sub };
    return this.patientService.createAppointment(user.tenantId, payload);
  }


  @Get("/treatments")
  listTreatments(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.patientService.listTreatments(user.tenantId, user.sub);
  }

  @Get("/treatments/:id/reports")
  async listTreatmentReports(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = this.getPatient(req);
    const treatment = await this.patientService.getTreatment(user.tenantId, id);
    if (treatment.patientUserId !== user.sub) {
      throw new ForbiddenException("Not allowed");
    }
    return this.patientService.listTreatmentReports(user.tenantId, id);
  }

  @Get("/interactions")
  listInteractions(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.patientService.listInteractions(user.tenantId, user.sub);
  }

  @Post("/interactions")
  createInteraction(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    return this.patientService.createInteraction(user.tenantId, user.sub, body || {});
  }

  @Post("/appointments/:id/request-change")
  requestChange(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
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
  requestCancel(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
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

  @Get("/preferences")
  getPreferences(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.preferenceService.getByPatient(user.tenantId, user.sub);
  }

  @Post("/preferences")
  updatePreferences(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    return this.preferenceService.upsert(user.tenantId, user.sub, body || {});
  }

  @Post("/visits/chat")
  chatAvailability(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    const message = body?.message || "";
    return this.visitChat.chatAvailability(user.tenantId, user.sub, message);
  }

  @Post("/faq/chat")
  async chatFaq(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    const message = body?.message?.toString() || "";
    const history = Array.isArray(body?.history) ? body.history : [];
    const response = await this.faqChat.chat(user.tenantId, message, history);
    await this.faqLogs.createLog(user.tenantId, user.sub);
    return response;
  }

  @Get("/faq/logs")
  listFaqLogs(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.faqLogs.listForPatient(user.tenantId, user.sub, 10);
  }

  @Get("/faq/handoffs")
  listFaqHandoffs(@Req() req: AuthRequest) {
    const user = this.getPatient(req);
    return this.faqHandoffs.listForPatient(user.tenantId, user.sub);
  }

  @Post("/faq/handoff")
  requestFaqHandoff(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getPatient(req);
    const messages = body?.messages ?? [];
    return this.faqHandoffs.requestHandoff(user.tenantId, user.sub, messages);
  }
}
