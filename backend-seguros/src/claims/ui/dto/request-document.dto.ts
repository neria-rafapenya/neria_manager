import { IsIn, IsOptional, IsString } from "class-validator";
import { CLAIM_DOCUMENT_KINDS } from "../../domain/entities/claim-document";

export class RequestDocumentDto {
  @IsIn(CLAIM_DOCUMENT_KINDS)
  kind!: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  aiMessage?: string;
}
