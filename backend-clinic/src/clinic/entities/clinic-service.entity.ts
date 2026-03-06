import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_services" })
export class ClinicServiceEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  code!: string | null;

  @Column({ type: "varchar", length: 180 })
  name!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  specialty!: string | null;

  @Column({ type: "int", nullable: true })
  durationMin!: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  priceMin!: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  priceMax!: number | null;

  @Column({ type: "text", nullable: true })
  prepNotes!: string | null;

  @Column({ type: "tinyint", width: 1, default: () => "1" })
  isActive!: boolean;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
