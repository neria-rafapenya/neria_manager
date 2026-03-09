import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { ClaimDocumentService } from "../../../domain/services/claim-document.service";
import { ClaimService } from "../../../domain/services/claim.service";
import { AddClaimDocumentDto } from "../../../ui/dto/add-claim-document.dto";
import { UploadClaimDocumentDto } from "../../../ui/dto/upload-claim-document.dto";
import { ClaimDocumentMapper } from "../../../ui/mappers/claim-document.mapper";
import { JwtAuthGuard } from "../../../../auth/adapters/in/http/guards/jwt-auth.guard";

@Controller("claims/:id/documents")
@UseGuards(JwtAuthGuard)
export class ClaimDocumentsController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly documentService: ClaimDocumentService,
  ) {}

  @Get()
  async list(@Param("id") id: string) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    const documents = await this.documentService.listByClaim(id);
    return documents.map((doc) => ClaimDocumentMapper.toResponse(doc));
  }

  @Post()
  async create(@Param("id") id: string, @Body() body: AddClaimDocumentDto) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    const document = await this.documentService.create({
      claimId: id,
      kind: body.kind,
      filename: body.filename,
      mimeType: body.mimeType,
      storageKey: body.storageKey,
      sizeBytes: body.sizeBytes,
      extractedFields: body.extractedFields ?? null,
      evidence: body.evidence ?? null,
    });

    return ClaimDocumentMapper.toResponse(document);
  }

  @Post("upload")
  async upload(@Param("id") id: string, @Body() body: UploadClaimDocumentDto) {
    const claim = await this.claimService.findById(id);
    if (!claim) {
      throw new NotFoundException("Claim not found");
    }

    const document = await this.documentService.uploadAndCreate({
      claimId: id,
      kind: body.kind,
      filename: body.filename,
      mimeType: body.mimeType,
      base64: body.base64,
    });

    return ClaimDocumentMapper.toResponse(document);
  }
}
