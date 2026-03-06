import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_time_off" })
export class ClinicTimeOffEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date" })
  endDate!: Date;

  @Column({ type: "datetime", nullable: true })
  startAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  endAt!: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
