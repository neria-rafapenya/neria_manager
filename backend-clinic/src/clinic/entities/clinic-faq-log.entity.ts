import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_faq_logs" })
export class ClinicFaqLogEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;
}
