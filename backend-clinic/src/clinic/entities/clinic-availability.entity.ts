import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_availability" })
export class ClinicAvailabilityEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "datetime" })
  startAt!: Date;

  @Column({ type: "datetime" })
  endAt!: Date;

  @Column({ type: "varchar", length: 80, nullable: true })
  serviceCode!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  practitionerName!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  reservedByPatientUserId!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  reservedByPatientEmail!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  reservedByPatientName!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  reservedAppointmentId!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
