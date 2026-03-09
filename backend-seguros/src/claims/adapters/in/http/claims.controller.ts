import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ClaimService } from "../../../domain/services/claim.service";
import { ClaimSummaryService } from "../../../domain/services/claim-summary.service";
import { ClaimMapper } from "../../../ui/mappers/claim.mapper";
import { CreateClaimDto } from "../../../ui/dto/create-claim.dto";
import { UpdateClaimStatusDto } from "../../../ui/dto/update-claim-status.dto";
import type { ClaimListFilters } from "../../../domain/repositories/claim.repository";
import { JwtAuthGuard } from "../../../../auth/adapters/in/http/guards/jwt-auth.guard";

@Controller("claims")
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly claimSummaryService: ClaimSummaryService,
  ) {}

  @Post()
  async create(@Body() body: CreateClaimDto) {
    const claim = await this.claimService.create({
      type: body.type,
      policyNumber: body.policyNumber ?? null,
      lossDate: body.lossDate ? new Date(body.lossDate) : null,
      description: body.description ?? null,
      urgency: body.urgency ?? false,
      thirdPartyInvolved: body.thirdPartyInvolved ?? false,
    });

    return ClaimMapper.toResponse(claim);
  }

  @Get()
  async list(@Query() query: ClaimListFilters) {
    const claims = await this.claimService.list({
      status: query.status,
      type: query.type,
      search: query.search,
    });

    return claims.map((claim) => ClaimMapper.toResponse(claim));
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    return ClaimMapper.toResponse(claim);
  }

  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body() body: UpdateClaimStatusDto) {
    const claim = await this.claimService.updateStatus({
      id,
      status: body.status,
      completenessStatus: body.completenessStatus,
    });

    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    return ClaimMapper.toResponse(claim);
  }

  @Post(":id/summary")
  async summary(@Param("id") id: string) {
    const summary = await this.claimSummaryService.generate(id);
    if (!summary) {
      throw new NotFoundException("Claim not found");
    }

    return { summary };
  }
}
