import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ClaimService } from "../../../domain/services/claim.service";
import { ClaimSummaryService } from "../../../domain/services/claim-summary.service";
import { ClaimDocumentRequestService } from "../../../domain/services/claim-document-request.service";
import { ClaimCommunicationService } from "../../../domain/services/claim-communication.service";
import { ClaimMapper } from "../../../ui/mappers/claim.mapper";
import { CreateClaimDto } from "../../../ui/dto/create-claim.dto";
import { UpdateClaimStatusDto } from "../../../ui/dto/update-claim-status.dto";
import { AssignClaimDto } from "../../../ui/dto/assign-claim.dto";
import { RequestDocumentDto } from "../../../ui/dto/request-document.dto";
import type { ClaimListFilters } from "../../../domain/repositories/claim.repository";
import { JwtAuthGuard } from "../../../../auth/adapters/in/http/guards/jwt-auth.guard";
import { RolesGuard } from "../../../../auth/adapters/in/http/guards/roles.guard";
import { Roles } from "../../../../auth/adapters/in/http/decorators/roles.decorator";
import { CurrentUser } from "../../../../auth/adapters/in/http/decorators/current-user.decorator";
import { ClaimDocumentRequestMapper } from "../../../ui/mappers/claim-document-request.mapper";

@Controller("claims")
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly claimSummaryService: ClaimSummaryService,
    private readonly claimDocumentRequestService: ClaimDocumentRequestService,
    private readonly claimCommunicationService: ClaimCommunicationService,
  ) {}

  @Post()
  async create(
    @Body() body: CreateClaimDto,
    @CurrentUser() user: { sub: string; role: string } | null,
  ) {
    const claim = await this.claimService.create({
      type: body.type,
      policyNumber: body.policyNumber ?? null,
      lossDate: body.lossDate ? new Date(body.lossDate) : null,
      description: body.description ?? null,
      urgency: body.urgency ?? false,
      thirdPartyInvolved: body.thirdPartyInvolved ?? false,
      customerUserId: user?.role === "user" ? user.sub : null,
    });

    return ClaimMapper.toResponse(claim);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin", "agente")
  async list(@Query() query: ClaimListFilters, @CurrentUser() user: { sub: string; role: string }) {
    const claims = await this.claimService.list({
      status: query.status,
      type: query.type,
      search: query.search,
      assignedAgentId: user?.role === "agente" ? user.sub : undefined,
    });

    const pendingCounts = await Promise.all(
      claims.map(async (claim) => {
        const pending = await this.claimDocumentRequestService.listPendingByClaim(claim.id);
        return pending.length;
      }),
    );

    return claims.map((claim, index) => ({
      ...ClaimMapper.toResponse(claim),
      pendingDocumentRequests: pendingCounts[index] ?? 0,
    }));
  }

  @Get("my")
  @UseGuards(RolesGuard)
  @Roles("user")
  async listMy(@CurrentUser() user: { sub: string; role: string }) {
    const claims = await this.claimService.listByCustomerUserId(user.sub);
    const pendingCounts = await Promise.all(
      claims.map(async (claim) => {
        const pending = await this.claimDocumentRequestService.listPendingByClaim(claim.id);
        return pending.length;
      }),
    );

    return claims.map((claim, index) => ({
      ...ClaimMapper.toResponse(claim),
      pendingDocumentRequests: pendingCounts[index] ?? 0,
    }));
  }

  @Get("my/:id")
  @UseGuards(RolesGuard)
  @Roles("user")
  async detailMy(@Param("id") id: string, @CurrentUser() user: { sub: string; role: string }) {
    const claim = await this.claimService.findById(id);
    if (!claim || claim.customerUserId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    return ClaimMapper.toResponse(claim);
  }

  @Get("my/:id/explanation")
  @UseGuards(RolesGuard)
  @Roles("user")
  async explanationMy(@Param("id") id: string, @CurrentUser() user: { sub: string; role: string }) {
    const claim = await this.claimService.findById(id);
    if (!claim || claim.customerUserId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    const pending = await this.claimDocumentRequestService.listPendingByClaim(claim.id);
    let explanation = "";
    try {
      explanation = await this.claimCommunicationService.generateAndCacheUserExplanation(
        claim,
        pending.map((item) => item.kind),
      );
    } catch {
      explanation = "Tu expediente esta en revision. Te informaremos de los proximos pasos.";
    }

    return { explanation };
  }

  @Get("document-requests")
  @UseGuards(RolesGuard)
  @Roles("user")
  async listDocumentRequests(@CurrentUser() user: { sub: string; email: string; role: string }) {
    const claims = await this.claimService.listByCustomerUserId(user.sub);
    const claimIds = new Set(claims.map((claim) => claim.id));
    const requests = await this.claimDocumentRequestService.listAll();
    const filtered = requests.filter((request) => claimIds.has(request.claimId));
    const responses = await Promise.all(
      filtered.map(async (request) => {
        const claim = claims.find((item) => item.id === request.claimId);
        return ClaimDocumentRequestMapper.toResponse(request, claim?.claimNumber ?? null);
      }),
    );

    return responses;
  }

  @Get("my/:id/document-requests")
  @UseGuards(RolesGuard)
  @Roles("user")
  async listMyDocumentRequests(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string; email: string; role: string },
  ) {
    const claim = await this.claimService.findById(id);
    if (!claim || claim.customerUserId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    const requests = await this.claimDocumentRequestService.listByClaim(id);
    return requests.map((request) => ClaimDocumentRequestMapper.toResponse(request, claim.claimNumber));
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles("admin", "agente")
  async detail(@Param("id") id: string, @CurrentUser() user: { sub: string; role: string }) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    if (user?.role === "agente" && claim.assignedAgentId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    return ClaimMapper.toResponse(claim);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles("admin", "agente")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: UpdateClaimStatusDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    const existing = await this.claimService.findById(id);
    if (!existing) {
      throw new NotFoundException("Claim not found");
    }

    if (user?.role === "agente" && existing.assignedAgentId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

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

  @Post(":id/assign")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async assign(
    @Param("id") id: string,
    @Body() body: AssignClaimDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    const claim = await this.claimService.assign(id, body.agentId, user?.sub ?? null);
    if (!claim) {
      throw new NotFoundException("Claim not found or agent invalid");
    }

    return ClaimMapper.toResponse(claim);
  }

  @Post(":id/request-document")
  @UseGuards(RolesGuard)
  @Roles("admin", "agente")
  async requestDocument(
    @Param("id") id: string,
    @Body() body: RequestDocumentDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    if (user?.role === "agente" && claim.assignedAgentId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    const request = await this.claimDocumentRequestService.create({
      claim,
      kind: body.kind as any,
      operatorNotes: body.message ?? null,
      aiMessageOverride: body.aiMessage ?? null,
      requestedBy: user?.sub ?? "",
    });

    return ClaimDocumentRequestMapper.toResponse(request, claim.claimNumber);
  }

  @Post(":id/request-document/preview")
  @UseGuards(RolesGuard)
  @Roles("admin", "agente")
  async requestDocumentPreview(
    @Param("id") id: string,
    @Body() body: RequestDocumentDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    if (user?.role === "agente" && claim.assignedAgentId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    const message = await this.claimDocumentRequestService.previewMessage({
      claim,
      kind: body.kind as any,
      operatorNotes: body.message ?? null,
    });

    return { message };
  }

  @Post(":id/summary")
  @UseGuards(RolesGuard)
  @Roles("admin", "agente")
  async summary(@Param("id") id: string, @CurrentUser() user: { sub: string; role: string }) {
    const existing = await this.claimService.findById(id);
    if (!existing) {
      throw new NotFoundException("Claim not found");
    }

    if (user?.role === "agente" && existing.assignedAgentId !== user.sub) {
      throw new NotFoundException("Claim not found");
    }

    const summary = await this.claimSummaryService.generate(id);
    if (!summary) {
      throw new NotFoundException("Claim not found");
    }

    return { summary };
  }
}
