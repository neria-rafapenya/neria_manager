import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicPatientInteractionEntity } from "./entities/clinic-patient-interaction.entity";
import { ClinicPatientAppointmentEntity } from "./entities/clinic-patient-appointment.entity";
import { ClinicPatientDocumentEntity } from "./entities/clinic-patient-document.entity";
import { ClinicPatientTreatmentEntity } from "./entities/clinic-patient-treatment.entity";

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
  scheduledAt?: Date | null;
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
  startedAt?: Date | null;
  completedAt?: Date | null;
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
  ) {}

  listInteractions(tenantId: string, patientUserId: string) {
    return this.interactions.find({
      where: { tenantId, patientUserId },
      order: { createdAt: "DESC" },
    });
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
      metadata: dto.metadata ?? null,
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
    const appointment = this.appointments.create({
      id: randomUUID(),
      tenantId,
      patientUserId: dto.patientUserId,
      title: dto.title || null,
      practitionerName: dto.practitionerName || null,
      location: dto.location || null,
      scheduledAt: dto.scheduledAt ?? null,
      durationMin: dto.durationMin ?? null,
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
    appointment.title = dto.title ?? appointment.title;
    appointment.practitionerName = dto.practitionerName ?? appointment.practitionerName;
    appointment.location = dto.location ?? appointment.location;
    appointment.scheduledAt = dto.scheduledAt ?? appointment.scheduledAt;
    appointment.durationMin = dto.durationMin ?? appointment.durationMin;
    appointment.status = dto.status ?? appointment.status;
    appointment.notes = dto.notes ?? appointment.notes;
    appointment.updatedAt = new Date();
    return this.appointments.save(appointment);
  }

  async deleteAppointment(tenantId: string, id: string) {
    const appointment = await this.appointments.findOne({ where: { tenantId, id } });
    if (!appointment) throw new NotFoundException("Appointment not found");
    await this.appointments.remove(appointment);
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
      startedAt: dto.startedAt ?? null,
      completedAt: dto.completedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.treatments.save(treatment);
  }

  async updateTreatment(tenantId: string, id: string, dto: TreatmentRequest) {
    const treatment = await this.treatments.findOne({ where: { tenantId, id } });
    if (!treatment) throw new NotFoundException("Treatment not found");
    treatment.name = dto.name ?? treatment.name;
    treatment.status = dto.status ?? treatment.status;
    treatment.nextStep = dto.nextStep ?? treatment.nextStep;
    treatment.notes = dto.notes ?? treatment.notes;
    treatment.startedAt = dto.startedAt ?? treatment.startedAt;
    treatment.completedAt = dto.completedAt ?? treatment.completedAt;
    treatment.updatedAt = new Date();
    return this.treatments.save(treatment);
  }

  async deleteTreatment(tenantId: string, id: string) {
    const treatment = await this.treatments.findOne({ where: { tenantId, id } });
    if (!treatment) throw new NotFoundException("Treatment not found");
    await this.treatments.remove(treatment);
  }
}
