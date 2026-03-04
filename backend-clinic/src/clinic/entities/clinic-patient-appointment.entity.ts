import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "clinic_patient_appointments" })
export class ClinicPatientAppointmentEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  tenantId!: string;

  @Column({ type: "varchar", length: 36 })
  patientUserId!: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  title!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  practitionerName!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  location!: string | null;

  @Column({ type: "datetime", nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: "int", nullable: true })
  durationMin!: number | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "datetime", nullable: true })
  createdAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  updatedAt!: Date | null;
}
