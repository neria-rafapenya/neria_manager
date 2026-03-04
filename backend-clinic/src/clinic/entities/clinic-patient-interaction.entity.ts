import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_patient_interactions" })
export class ClinicPatientInteractionEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  title!: string | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  type!: string | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  status!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  summary!: string | null;

  @Column({ type: "json", nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
