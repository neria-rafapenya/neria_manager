import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_users" })
export class ClinicUserEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 160 })
  email!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 32 })
  role!: string;

  @Column({ type: "varchar", length: 16 })
  status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ type: "tinyint", width: 1, default: () => "0" })
  mustChangePassword!: boolean;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
