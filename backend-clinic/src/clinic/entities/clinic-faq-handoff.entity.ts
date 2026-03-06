import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_faq_handoffs" })
export class ClinicFaqHandoffEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  patientEmail!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  patientName!: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  status!: string | null;

  @Column({ type: "json", nullable: true })
  messages!: { role: string; content: string }[] | null;

  @Column({ type: "text", nullable: true })
  responseText!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  respondedByUserId!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  respondedByName!: string | null;

  @Column({ type: "datetime", nullable: true })
  requestedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  respondedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
