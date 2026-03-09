import { IsIn, IsString } from "class-validator";
import type { ClaimDocumentKind } from "../../domain/entities/claim-document";

const CLAIM_DOCUMENT_KINDS = [
  "parte_amistoso",
  "atestados",
  "factura",
  "presupuesto",
  "informe_medico",
  "foto",
  "poliza",
  "dni",
  "otro",
] as const;

export class UploadClaimDocumentDto {
  @IsIn(CLAIM_DOCUMENT_KINDS)
  kind!: ClaimDocumentKind;

  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  base64!: string;
}
