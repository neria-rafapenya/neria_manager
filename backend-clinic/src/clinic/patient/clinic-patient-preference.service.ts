import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicPatientPreferenceEntity } from "../entities/clinic-patient-preference.entity";

export type PatientPreferenceUpdate = {
  preferredTimeOfDay?: string | null;
  preferredPractitionerName?: string | null;
  preferredTreatment?: string | null;
  preferredDays?: string[] | null;
  unavailableDays?: string[] | null;
  notes?: string | null;
};

@Injectable()
export class ClinicPatientPreferenceService {
  constructor(
    @InjectRepository(ClinicPatientPreferenceEntity)
    private readonly repo: Repository<ClinicPatientPreferenceEntity>,
  ) {}

  getByPatient(tenantId: string, patientUserId: string) {
    return this.repo.findOne({ where: { tenantId, patientUserId } });
  }

  async upsert(
    tenantId: string,
    patientUserId: string,
    update: PatientPreferenceUpdate,
  ) {
    const existing = await this.getByPatient(tenantId, patientUserId);
    if (existing) {
      existing.preferredTimeOfDay =
        update.preferredTimeOfDay ?? existing.preferredTimeOfDay ?? null;
      existing.preferredPractitionerName =
        update.preferredPractitionerName ??
        existing.preferredPractitionerName ??
        null;
      existing.preferredTreatment =
        update.preferredTreatment ?? existing.preferredTreatment ?? null;
      existing.preferredDays =
        update.preferredDays ?? existing.preferredDays ?? null;
      existing.unavailableDays =
        update.unavailableDays ?? existing.unavailableDays ?? null;
      existing.notes = update.notes ?? existing.notes ?? null;
      existing.updatedAt = new Date();
      return this.repo.save(existing);
    }
    const created = this.repo.create({
      id: randomUUID(),
      tenantId,
      patientUserId,
      preferredTimeOfDay: update.preferredTimeOfDay ?? null,
      preferredPractitionerName: update.preferredPractitionerName ?? null,
      preferredTreatment: update.preferredTreatment ?? null,
      preferredDays: update.preferredDays ?? null,
      unavailableDays: update.unavailableDays ?? null,
      notes: update.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repo.save(created);
  }
}
