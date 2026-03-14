import { IsString, IsUUID } from "class-validator";

export class AssignClaimDto {
  @IsString()
  @IsUUID()
  agentId!: string;
}

