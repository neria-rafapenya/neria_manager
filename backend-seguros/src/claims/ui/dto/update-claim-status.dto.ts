import { IsIn, IsOptional } from "class-validator";
import { CLAIM_STATUSES, COMPLETENESS_STATUSES } from "../../domain/entities/claim";
import type { ClaimStatus, CompletenessStatus } from "../../domain/entities/claim";

export class UpdateClaimStatusDto {
  @IsIn(CLAIM_STATUSES)
  status!: ClaimStatus;

  @IsOptional()
  @IsIn(COMPLETENESS_STATUSES)
  completenessStatus?: CompletenessStatus;
}
