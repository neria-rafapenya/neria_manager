import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "seguros_claim_document_requests" })
export class ClaimDocumentRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "claim_id", type: "char", length: 36 })
  claimId!: string;

  @Column({ type: "varchar", length: 30 })
  kind!: string;

  @Column({ type: "text" })
  message!: string;

  @Index()
  @Column({ type: "varchar", length: 20, default: "pendiente" })
  status!: string;

  @Column({ name: "requested_by", type: "char", length: 36 })
  requestedBy!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @Column({ name: "resolved_at", type: "datetime", nullable: true })
  resolvedAt!: Date | null;
}

