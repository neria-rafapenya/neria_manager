import { IsBoolean, IsIn, IsOptional, IsString, IsDateString } from "class-validator";
import { CLAIM_TYPES } from "../../domain/entities/claim";
import type { ClaimType } from "../../domain/entities/claim";

export class CreateClaimDto {
  @IsIn(CLAIM_TYPES)
  type!: ClaimType;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsDateString()
  lossDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  urgency?: boolean;

  @IsOptional()
  @IsBoolean()
  thirdPartyInvolved?: boolean;
}
