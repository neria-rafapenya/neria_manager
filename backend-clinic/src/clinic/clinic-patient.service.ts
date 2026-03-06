import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicPatientInteractionEntity } from "./entities/clinic-patient-interaction.entity";
import { ClinicPatientAppointmentEntity } from "./entities/clinic-patient-appointment.entity";
import { ClinicPatientDocumentEntity } from "./entities/clinic-patient-document.entity";
import { ClinicPatientTreatmentEntity } from "./entities/clinic-patient-treatment.entity";
import { ClinicPatientTreatmentReportEntity } from "./entities/clinic-patient-treatment-report.entity";
import { ClinicAvailabilityService } from "./availability/clinic-availability.service";
import { ClinicTimeOffService } from "./time-off/clinic-time-off.service";
import { ClinicUserService } from "./clinic-user.service";

export interface InteractionRequest {
  patientUserId?: string;
  title?: string;
  type?: string;
  status?: string;
  summary?: string;
  metadata?: string | Record<string, unknown> | null;
}

export interface AppointmentRequest {
  patientUserId?: string;
  title?: string;
  practitionerName?: string;
  location?: string;
  scheduledAt?: Date | string | null;
  durationMin?: number | null;
  status?: string | null;
  notes?: string | null;
}

export interface DocumentRequest {
  patientUserId?: string;
  title?: string;
  category?: string;
  url?: string;
  status?: string;
}

export interface TreatmentRequest {
  patientUserId?: string;
  name?: string;
  status?: string;
  nextStep?: string;
  notes?: string;
  reportTitle?: string | null;
  reportText?: string | null;
  reportFileUrl?: string | null;
  reportFileName?: string | null;
  reportFileMime?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export interface TreatmentReportRequest {
  title?: string | null;
  text?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileMime?: string | null;
  createdByUserId?: string | null;
  createdByName?: string | null;
}

@Injectable()
export class ClinicPatientService {
  constructor(
    @InjectRepository(ClinicPatientInteractionEntity)
    private readonly interactions: Repository<ClinicPatientInteractionEntity>,
    @InjectRepository(ClinicPatientAppointmentEntity)
    private readonly appointments: Repository<ClinicPatientAppointmentEntity>,
    @InjectRepository(ClinicPatientDocumentEntity)
    private readonly documents: Repository<ClinicPatientDocumentEntity>,
    @InjectRepository(ClinicPatientTreatmentEntity)
    private readonly treatments: Repository<ClinicPatientTreatmentEntity>,
    @InjectRepository(ClinicPatientTreatmentReportEntity)
    private readonly treatmentReports: Repository<ClinicPatientTreatmentReportEntity>,
    private readonly availabilityService: ClinicAvailabilityService,
    private readonly timeOffService: ClinicTimeOffService,
    private readonly userService: ClinicUserService,
  ) {}

  listInteractions(tenantId: string, patientUserId: string) {
    return this.interactions.find({
      where: { tenantId, patientUserId },
      order: { createdAt: "DESC" },
    });
  }



  private computeEnd(startAt: Date, durationMin: number) {
    const end = new Date(startAt);
    end.setMinutes(end.getMinutes() + durationMin);
    return end;
  }

  private async validateAppointment(tenantId: string, startAt: Date, durationMin: number, appointmentId?: string) {
    const endAt = this.computeEnd(startAt, durationMin);
    const blocked = await this.timeOffService.hasOverlap(tenantId, startAt, endAt);
    if (blocked) {
      throw new BadRequestException("Selected day is not available");
    }
    const availability = await this.availabilityService.findCoveringSlot(tenantId, startAt, endAt);
    if (!availability) {
      throw new BadRequestException("No availability for selected time");
    }
    const qb = this.appointments.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.scheduledAt < :endAt', { endAt })
      .andWhere('DATE_ADD(a.scheduledAt, INTERVAL IFNULL(a.durationMin, 30) MINUTE) > :startAt', { startAt });
    if (appointmentId) {
      qb.andWhere('a.id <> :id', { id: appointmentId });
    }
    const conflict = await qb.getOne();
    if (conflict) {
      throw new BadRequestException("Time slot already booked");
    }
  }
  private normalizeMetadata(value: InteractionRequest["metadata"]) {
    if (value == null) return null;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return { text: value };
      }
    }
    return value as Record<string, unknown>;
  }
  async createInteraction(tenantId: string, patientUserId: string, dto: InteractionRequest) {
    if (!dto) throw new BadRequestException("Missing payload");
    const interaction = this.interactions.create({
      id: randomUUID(),
      tenantId,
      patientUserId,
      title: dto.title || null,
      type: dto.type || "note",
      status: dto.status || "open",
      summary: dto.summary || null,
      metadata: this.normalizeMetadata(dto.metadata),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.interactions.save(interaction);
  }

  listAppointments(tenantId: string, patientUserId: string) {
    return this.appointments.find({
      where: { tenantId, patientUserId },
      order: { scheduledAt: "DESC" },
    });
  }

  listAppointmentsAll(tenantId: string) {
    return this.appointments.find({ where: { tenantId } });
  }

  async createAppointment(tenantId: string, dto: AppointmentRequest) {
    if (!dto?.patientUserId) {
      throw new BadRequestException("Missing patient");
    }
    if (!dto.scheduledAt) {
      throw new BadRequestException("Missing scheduledAt");
    }
    const startAt = new Date(dto.scheduledAt as any);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException("Invalid scheduledAt");
    }
    const durationMin = dto.durationMin ?? 30;
    await this.validateAppointment(tenantId, startAt, durationMin);
    const endAt = this.computeEnd(startAt, durationMin);
    const patient = await this.userService.getById(tenantId, dto.patientUserId);
    const appointmentId = randomUUID();
    await this.availabilityService.consumeSlot(tenantId, startAt, endAt, {
      patientUserId: patient.id,
      patientEmail: patient.email,
      patientName: patient.name || patient.email,
      appointmentId,
    });
    const appointment = this.appointments.create({
      id: appointmentId,
      tenantId,
      patientUserId: dto.patientUserId,
      title: dto.title || null,
      practitionerName: dto.practitionerName || null,
      location: dto.location || null,
      scheduledAt: startAt,
      durationMin,
      status: dto.status || "scheduled",
      notes: dto.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.appointments.save(appointment);
  }

  async updateAppointment(tenantId: string, id: string, dto: AppointmentRequest) {
    const appointment = await this.appointments.findOne({ where: { tenantId, id } });
    if (!appointment) throw new NotFoundException("Appointment not found");
    const originalStart = new Date(appointment.scheduledAt as any);
    const originalDuration = appointment.durationMin ?? 30;
    let timeChanged = false;
    appointment.title = dto.title ?? appointment.title;
    appointment.practitionerName = dto.practitionerName ?? appointment.practitionerName;
    appointment.location = dto.location ?? appointment.location;
    if (dto.scheduledAt || dto.durationMin) {
      const startAt = new Date((dto.scheduledAt ?? appointment.scheduledAt) as any);
      if (Number.isNaN(startAt.getTime())) {
        throw new BadRequestException("Invalid scheduledAt");
      }
      const durationMin = dto.durationMin ?? appointment.durationMin ?? 30;
      await this.validateAppointment(tenantId, startAt, durationMin, id);
      timeChanged =
        startAt.getTime() !== originalStart.getTime() || durationMin !== originalDuration;
      if (timeChanged) {
        const patient = await this.userService.getById(tenantId, appointment.patientUserId);
        await this.availabilityService.consumeSlot(
          tenantId,
          startAt,
          this.computeEnd(startAt, durationMin),
          {
            patientUserId: patient.id,
            patientEmail: patient.email,
            patientName: patient.name || patient.email,
            appointmentId: appointment.id,
          },
        );
      }
      appointment.scheduledAt = startAt;
      appointment.durationMin = durationMin;
    }
    appointment.status = dto.status ?? appointment.status;
    appointment.notes = dto.notes ?? appointment.notes;
    appointment.updatedAt = new Date();
    const saved = await this.appointments.save(appointment);
    if (timeChanged) {
      await this.availabilityService.releaseSlot(
        tenantId,
        originalStart,
        this.computeEnd(originalStart, originalDuration),
      );
    }
    return saved;
  }

  async deleteAppointment(tenantId: string, id: string) {
    const appointment = await this.appointments.findOne({ where: { tenantId, id } });
    if (!appointment) throw new NotFoundException("Appointment not found");
    await this.appointments.remove(appointment);
    const startAt = new Date(appointment.scheduledAt as any);
    const durationMin = appointment.durationMin ?? 30;
    await this.availabilityService.releaseSlot(
      tenantId,
      startAt,
      this.computeEnd(startAt, durationMin),
    );
  }

  listDocuments(tenantId: string, patientUserId: string) {
    return this.documents.find({
      where: { tenantId, patientUserId },
      order: { createdAt: "DESC" },
    });
  }

  listDocumentsAll(tenantId: string) {
    return this.documents.find({ where: { tenantId } });
  }

  async createDocument(tenantId: string, dto: DocumentRequest) {
    if (!dto?.patientUserId) {
      throw new BadRequestException("Missing patient");
    }
    const doc = this.documents.create({
      id: randomUUID(),
      tenantId,
      patientUserId: dto.patientUserId,
      title: dto.title || null,
      category: dto.category || null,
      url: dto.url || null,
      status: dto.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.documents.save(doc);
  }

  async updateDocument(tenantId: string, id: string, dto: DocumentRequest) {
    const doc = await this.documents.findOne({ where: { tenantId, id } });
    if (!doc) throw new NotFoundException("Document not found");
    doc.title = dto.title ?? doc.title;
    doc.category = dto.category ?? doc.category;
    doc.url = dto.url ?? doc.url;
    doc.status = dto.status ?? doc.status;
    doc.updatedAt = new Date();
    return this.documents.save(doc);
  }

  async deleteDocument(tenantId: string, id: string) {
    const doc = await this.documents.findOne({ where: { tenantId, id } });
    if (!doc) throw new NotFoundException("Document not found");
    await this.documents.remove(doc);
  }

  listTreatments(tenantId: string, patientUserId: string) {
    return this.treatments.find({
      where: { tenantId, patientUserId },
      order: { createdAt: "DESC" },
    });
  }

  listTreatmentsAll(tenantId: string) {
    return this.treatments.find({ where: { tenantId } });
  }

  listTreatmentReports(tenantId: string, treatmentId: string) {
    return this.treatmentReports.find({
      where: { tenantId, treatmentId },
      order: { createdAt: "DESC" },
    });
  }

  async deleteTreatmentReport(tenantId: string, id: string) {
    const report = await this.treatmentReports.findOne({ where: { tenantId, id } });
    if (!report) {
      throw new NotFoundException("Treatment report not found");
    }
    await this.treatmentReports.remove(report);
  }

  private async createTreatmentReport(
    tenantId: string,
    treatmentId: string,
    payload: TreatmentReportRequest,
  ) {
    const hasContent =
      payload.title || payload.text || payload.fileUrl || payload.fileName;
    if (!hasContent) return null;
    const report = this.treatmentReports.create({
      id: randomUUID(),
      tenantId,
      treatmentId,
      title: payload.title ?? null,
      text: payload.text ?? null,
      fileUrl: payload.fileUrl ?? null,
      fileName: payload.fileName ?? null,
      fileMime: payload.fileMime ?? null,
      createdByUserId: payload.createdByUserId ?? null,
      createdByName: payload.createdByName ?? null,
      createdAt: new Date(),
    });
    return this.treatmentReports.save(report);
  }

  async createTreatment(tenantId: string, dto: TreatmentRequest) {
    if (!dto?.patientUserId) {
      throw new BadRequestException("Missing patient");
    }
    const treatment = this.treatments.create({
      id: randomUUID(),
      tenantId,
      patientUserId: dto.patientUserId,
      name: dto.name || null,
      status: dto.status || "planned",
      nextStep: dto.nextStep || null,
      notes: dto.notes || null,
      reportTitle: dto.reportTitle ?? null,
      reportText: dto.reportText ?? null,
      reportFileUrl: dto.reportFileUrl ?? null,
      reportFileName: dto.reportFileName ?? null,
      reportFileMime: dto.reportFileMime ?? null,
      startedAt: dto.startedAt ?? null,
      completedAt: dto.completedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.treatments.save(treatment);
    await this.createTreatmentReport(tenantId, saved.id, {
      title: dto.reportTitle ?? null,
      text: dto.reportText ?? null,
      fileUrl: dto.reportFileUrl ?? null,
      fileName: dto.reportFileName ?? null,
      fileMime: dto.reportFileMime ?? null,
    });
    return saved;
  }

  async getTreatment(tenantId: string, id: string) {
    const treatment = await this.treatments.findOne({ where: { tenantId, id } });
    if (!treatment) throw new NotFoundException("Treatment not found");
    return treatment;
  }

  async updateTreatment(tenantId: string, id: string, dto: TreatmentRequest) {
    const treatment = await this.getTreatment(tenantId, id);
    treatment.name = dto.name ?? treatment.name;
    treatment.status = dto.status ?? treatment.status;
    treatment.nextStep = dto.nextStep ?? treatment.nextStep;
    treatment.notes = dto.notes ?? treatment.notes;
    treatment.reportTitle = dto.reportTitle ?? treatment.reportTitle;
    treatment.reportText = dto.reportText ?? treatment.reportText;
    treatment.reportFileUrl = dto.reportFileUrl ?? treatment.reportFileUrl;
    treatment.reportFileName = dto.reportFileName ?? treatment.reportFileName;
    treatment.reportFileMime = dto.reportFileMime ?? treatment.reportFileMime;
    treatment.startedAt = dto.startedAt ?? treatment.startedAt;
    treatment.completedAt = dto.completedAt ?? treatment.completedAt;
    treatment.updatedAt = new Date();
    const saved = await this.treatments.save(treatment);
    await this.createTreatmentReport(tenantId, saved.id, {
      title: dto.reportTitle,
      text: dto.reportText,
      fileUrl: dto.reportFileUrl,
      fileName: dto.reportFileName,
      fileMime: dto.reportFileMime,
    });
    return saved;
  }

  async updateTreatmentReport(
    tenantId: string,
    id: string,
    dto: TreatmentRequest,
    createdByUserId?: string | null,
    createdByName?: string | null,
  ) {
    const treatment = await this.getTreatment(tenantId, id);
    treatment.reportTitle = dto.reportTitle ?? treatment.reportTitle;
    treatment.reportText = dto.reportText ?? treatment.reportText;
    treatment.reportFileUrl = dto.reportFileUrl ?? treatment.reportFileUrl;
    treatment.reportFileName = dto.reportFileName ?? treatment.reportFileName;
    treatment.reportFileMime = dto.reportFileMime ?? treatment.reportFileMime;
    treatment.updatedAt = new Date();
    const saved = await this.treatments.save(treatment);
    await this.createTreatmentReport(tenantId, saved.id, {
      title: dto.reportTitle ?? saved.reportTitle ?? null,
      text: dto.reportText ?? saved.reportText ?? null,
      fileUrl: dto.reportFileUrl ?? saved.reportFileUrl ?? null,
      fileName: dto.reportFileName ?? saved.reportFileName ?? null,
      fileMime: dto.reportFileMime ?? saved.reportFileMime ?? null,
      createdByUserId: createdByUserId ?? null,
      createdByName: createdByName ?? null,
    });
    return saved;
  }

  async attachTreatmentReport(
    tenantId: string,
    id: string,
    payload: {
      url: string;
      name?: string | null;
      mime?: string | null;
      title?: string | null;
      createdByUserId?: string | null;
      createdByName?: string | null;
    },
  ) {
    const treatment = await this.treatments.findOne({ where: { tenantId, id } });
    if (!treatment) throw new NotFoundException("Treatment not found");
    treatment.reportFileUrl = payload.url;
    treatment.reportFileName = payload.name ?? treatment.reportFileName ?? null;
    treatment.reportFileMime = payload.mime ?? treatment.reportFileMime ?? null;
    if (payload.title) {
      treatment.reportTitle = payload.title;
    }
    treatment.updatedAt = new Date();
    const saved = await this.treatments.save(treatment);
    await this.createTreatmentReport(tenantId, saved.id, {
      title: payload.title ?? treatment.reportTitle ?? null,
      text: treatment.reportText ?? null,
      fileUrl: payload.url,
      fileName: payload.name ?? null,
      fileMime: payload.mime ?? null,
      createdByUserId: payload.createdByUserId ?? null,
      createdByName: payload.createdByName ?? null,
    });
    return saved;
  }

  async deleteTreatment(tenantId: string, id: string) {
    const treatment = await this.getTreatment(tenantId, id);
    await this.treatments.remove(treatment);
  }
}
