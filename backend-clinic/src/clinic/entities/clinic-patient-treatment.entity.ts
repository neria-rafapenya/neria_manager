import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_patient_treatments" })
export class ClinicPatientTreatmentEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  nextStep!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "datetime", nullable: true })
  startedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  completedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
