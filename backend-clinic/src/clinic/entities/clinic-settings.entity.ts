import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_settings" })
export class ClinicSettingsEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  legalName!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  timezone!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  website!: string | null;

  @Column({ type: "text", nullable: true })
  emergencyDisclaimer!: string | null;

  @Column({ type: "text", nullable: true })
  privacyNotice!: string | null;

  @Column({ type: "json", nullable: true })
  openingHours!: Record<string, unknown> | null;

  @Column({ type: "json", nullable: true })
  channels!: Record<string, unknown> | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
