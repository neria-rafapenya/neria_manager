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
  UseInterceptors,
  UploadedFile,
  UseGuards,
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
import { CloudinaryService } from "../storage/cloudinary.service";
import { ClinicFaqLogService } from "../faq/clinic-faq-log.service";
import { ClinicFaqHandoffService } from "../faq/clinic-faq-handoff.service";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow/staff")
@UseGuards(ClinicAuthGuard)
export class ClinicStaffController {
  constructor(
    private readonly patientService: ClinicPatientService,
    private readonly userService: ClinicUserService,
    private readonly cloudinary: CloudinaryService,
    private readonly faqLogs: ClinicFaqLogService,
    private readonly faqHandoffs: ClinicFaqHandoffService,
  ) {}

  private getStaff(req: AuthRequest, roles: string[] = ["manager", "staff", "assistant"]) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, ...roles);
    return user;
  }

  @Get("/patients")
  listPatients(@Req() req: AuthRequest) {
    const user = this.getStaff(req);
    return this.userService.listPatients(user.tenantId);
  }

  @Get("/patients/search")
  searchPatients(@Req() req: AuthRequest, @Query("q") query?: string) {
    const user = this.getStaff(req);
    if (!query?.trim()) return [];
    return this.userService.searchPatients(user.tenantId, query);
  }

  @Get("/appointments")
  listAppointments(@Req() req: AuthRequest, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return this.patientService.listAppointmentsAll(user.tenantId);
    }
    return this.patientService.listAppointments(user.tenantId, patientUserId);
  }

  @Post("/appointments")
  createAppointment(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    return this.patientService.createAppointment(user.tenantId, body || {});
  }

  @Patch("/appointments/:id")
  updateAppointment(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.updateAppointment(user.tenantId, id, body || {});
  }

  @Delete("/appointments/:id")
  deleteAppointment(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.deleteAppointment(user.tenantId, id);
  }

  @Get("/documents")
  listDocuments(@Req() req: AuthRequest, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return this.patientService.listDocumentsAll(user.tenantId);
    }
    return this.patientService.listDocuments(user.tenantId, patientUserId);
  }

  @Post("/documents")
  createDocument(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.createDocument(user.tenantId, body || {});
  }

  @Post("/documents/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/csv",
          "application/csv",
          "image/png",
          "image/jpeg",
        ];
        if (!allowed.includes(file.mimetype)) {
          cb(new Error("Invalid file type"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any,
  ) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    if (!body?.patientUserId) {
      throw new BadRequestException("Missing patientUserId");
    }
    if (!file?.buffer) {
      throw new BadRequestException("Missing file");
    }
    const category = String(body?.category || "").toLowerCase();
    const allowedCategories = [
      "certificados",
      "resultados",
      "facturas",
      "circulares",
      "presupuestos",
    ];
    if (category && !allowedCategories.includes(category)) {
      throw new BadRequestException("Invalid category");
    }
    const resourceType = file.mimetype.startsWith("image/") ? "image" : "raw";
    const url = await this.cloudinary.uploadDocument(
      file.buffer,
      file.originalname,
      user.tenantId,
      body.patientUserId,
      resourceType,
    );
    return this.patientService.createDocument(user.tenantId, {
      patientUserId: body.patientUserId,
      title: body?.title || file.originalname,
      category: category || "otros",
      url,
      status: "available",
    });
  }

  @Patch("/documents/:id")
  updateDocument(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.updateDocument(user.tenantId, id, body || {});
  }

  @Delete("/documents/:id")
  deleteDocument(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.deleteDocument(user.tenantId, id);
  }

  @Get("/treatments")
  listTreatments(@Req() req: AuthRequest, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return this.patientService.listTreatmentsAll(user.tenantId);
    }
    return this.patientService.listTreatments(user.tenantId, patientUserId);
  }

  @Post("/treatments")
  createTreatment(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    return this.patientService.createTreatment(user.tenantId, body || {});
  }

  @Get("/treatments/:id/reports")
  listTreatmentReports(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    return this.patientService.listTreatmentReports(user.tenantId, id);
  }

  @Delete("/treatments/reports/:reportId")
  deleteTreatmentReport(@Req() req: AuthRequest, @Param("reportId") reportId: string) {
    const user = this.getStaff(req, ["manager", "staff"]);
    return this.patientService.deleteTreatmentReport(user.tenantId, reportId);
  }

  @Patch("/treatments/:id/report")
  updateTreatmentReport(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    return this.patientService.updateTreatmentReport(
      user.tenantId,
      id,
      body || {},
      user.sub,
      user.name,
    );
  }

  @Post("/treatments/:id/report-upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadTreatmentReport(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    if (!file?.buffer) {
      throw new BadRequestException("Missing file");
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "image/png",
      "image/jpeg",
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException("Invalid file type");
    }
    const treatment = await this.patientService.getTreatment(user.tenantId, id);
    const resourceType = file.mimetype.startsWith("image/") ? "image" : "raw";
    const url = await this.cloudinary.uploadTreatmentReport(
      file.buffer,
      file.originalname,
      user.tenantId,
      treatment.patientUserId,
      resourceType,
    );
    return this.patientService.attachTreatmentReport(user.tenantId, id, {
      url,
      name: file.originalname,
      mime: file.mimetype,
      title: body?.title ? String(body.title) : undefined,
      createdByUserId: user.sub,
      createdByName: user.name,
    });
  }

  @Patch("/treatments/:id")
  updateTreatment(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    return this.patientService.updateTreatment(user.tenantId, id, body || {});
  }

  @Delete("/treatments/:id")
  deleteTreatment(@Req() req: AuthRequest, @Param("id") id: string) {
    const user = this.getStaff(req, ["manager"]);
    return this.patientService.deleteTreatment(user.tenantId, id);
  }

  @Get("/interactions")
  listInteractions(@Req() req: AuthRequest, @Query("patientUserId") patientUserId?: string) {
    const user = this.getStaff(req);
    if (!patientUserId) {
      return [];
    }
    return this.patientService.listInteractions(user.tenantId, patientUserId);
  }

  @Post("/interactions")
  createInteraction(@Req() req: AuthRequest, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    if (!body?.patientUserId) {
      throw new BadRequestException("Missing patientUserId");
    }
    return this.patientService.createInteraction(user.tenantId, body.patientUserId, body || {});
  }

  @Get("/faq/logs")
  async listFaqLogs(@Req() req: AuthRequest) {
    const user = this.getStaff(req);
    const logs = await this.faqLogs.listForTenant(user.tenantId, 200);
    const patientIds = Array.from(new Set(logs.map((log) => log.patientUserId)));
    const patients = await this.userService.listByIds(user.tenantId, patientIds);
    const patientMap = new Map(patients.map((p) => [p.id, p]));
    return logs.map((log) => ({
      id: log.id,
      patientUserId: log.patientUserId,
      createdAt: log.createdAt,
      patient: patientMap.get(log.patientUserId)
        ? {
            id: patientMap.get(log.patientUserId)?.id,
            name: patientMap.get(log.patientUserId)?.name,
            email: patientMap.get(log.patientUserId)?.email,
          }
        : null,
    }));
  }

  @Get("/faq/handoffs")
  listFaqHandoffs(@Req() req: AuthRequest) {
    const user = this.getStaff(req);
    return this.faqHandoffs.listForTenant(user.tenantId);
  }

  @Post("/faq/handoffs/:id/respond")
  respondFaqHandoff(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    const user = this.getStaff(req, ["manager", "staff", "assistant"]);
    return this.faqHandoffs.respond(
      user.tenantId,
      id,
      { id: user.sub, name: user.name },
      body?.responseText,
    );
  }
}
