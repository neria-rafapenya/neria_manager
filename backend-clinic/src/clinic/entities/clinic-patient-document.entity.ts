import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_patient_documents" })
export class ClinicPatientDocumentEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  title!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  category!: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  url!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
