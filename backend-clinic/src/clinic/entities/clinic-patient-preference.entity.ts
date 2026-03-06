import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_patient_preferences" })
export class ClinicPatientPreferenceEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  preferredTimeOfDay!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  preferredPractitionerName!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  preferredTreatment!: string | null;

  @Column({ type: "json", nullable: true })
  preferredDays!: string[] | null;

  @Column({ type: "json", nullable: true })
  unavailableDays!: string[] | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
