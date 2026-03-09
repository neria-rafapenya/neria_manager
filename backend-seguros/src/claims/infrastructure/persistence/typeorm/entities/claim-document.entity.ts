import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ClaimEntity } from "./claim.entity";

@Entity({ name: "seguros_claim_documents" })
export class ClaimDocumentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "claim_id", type: "varchar", length: 36 })
  claimId!: string;

  @ManyToOne(() => ClaimEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "claim_id" })
  claim!: ClaimEntity;

  @Column({ type: "varchar", length: 30 })
  kind!: string;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ name: "mime_type", type: "varchar", length: 120 })
  mimeType!: string;

  @Column({ name: "storage_key", type: "varchar", length: 255 })
  storageKey!: string;

  @Column({ name: "size_bytes", type: "int" })
  sizeBytes!: number;

  @Column({ name: "extracted_fields", type: "json", nullable: true })
  extractedFields!: Record<string, unknown> | null;

  @Column({ type: "json", nullable: true })
  evidence!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
