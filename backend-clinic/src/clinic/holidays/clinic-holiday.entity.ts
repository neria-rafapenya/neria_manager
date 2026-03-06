import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_holidays" })
export class ClinicHolidayEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "date" })
  date!: Date;

  @Column({ type: "varchar", length: 180, nullable: true })
  name!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
