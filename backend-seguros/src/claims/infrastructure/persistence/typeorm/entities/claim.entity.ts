import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "seguros_claims" })
export class ClaimEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "claim_number", type: "varchar", length: 32, unique: true })
  claimNumber!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  type!: string;

  @Index()
  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ name: "policy_number", type: "varchar", length: 64, nullable: true })
  policyNumber!: string | null;

  @Column({ name: "loss_date", type: "date", nullable: true })
  lossDate!: Date | null;

  @Column({ name: "reported_at", type: "datetime" })
  reportedAt!: Date;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "boolean", default: false })
  urgency!: boolean;

  @Column({ name: "third_party_involved", type: "boolean", default: false })
  thirdPartyInvolved!: boolean;

  @Column({ name: "completeness_status", type: "varchar", length: 20, default: "incompleto" })
  completenessStatus!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
