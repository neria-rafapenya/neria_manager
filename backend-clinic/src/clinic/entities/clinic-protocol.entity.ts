import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_protocols" })
export class ClinicProtocolEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 180 })
  title!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  version!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  summary!: string | null;

  @Column({ type: "text", nullable: true })
  content!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  approvedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  approvedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
