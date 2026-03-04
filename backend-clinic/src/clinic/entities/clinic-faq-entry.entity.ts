import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_faq_entries" })
export class ClinicFaqEntryEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 255 })
  question!: string;

  @Column({ type: "text", nullable: true })
  answer!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  category!: string | null;

  @Column({ type: "int", nullable: true })
  priority!: number | null;

  @Column({ type: "tinyint", width: 1, default: () => "1" })
  isActive!: boolean;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
