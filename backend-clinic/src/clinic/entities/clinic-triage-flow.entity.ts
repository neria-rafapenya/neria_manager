import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_triage_flows" })
export class ClinicTriageFlowEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 180 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  outcome!: string | null;

  @Column({ type: "json", nullable: true })
  steps!: Record<string, unknown> | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
