import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_patient_treatment_reports" })
export class ClinicPatientTreatmentReportEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  treatmentId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  title!: string | null;

  @Column({ type: "text", nullable: true })
  text!: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  fileUrl!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  fileName!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  fileMime!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  createdByUserId!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  createdByName!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;
}
