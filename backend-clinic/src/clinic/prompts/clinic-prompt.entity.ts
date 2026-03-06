import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_prompts" })
export class ClinicPromptEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 80 })
  key!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
