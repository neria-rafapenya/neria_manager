import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AI_SUMMARY_REPOSITORY,
  CLAIM_DOCUMENT_REPOSITORY,
  CLAIM_REPOSITORY,
  STORAGE_REPOSITORY,
} from "./claims.constants";
import { ClaimsController } from "./adapters/in/http/claims.controller";
import { ClaimDocumentsController } from "./adapters/in/http/documents.controller";
import { ClaimService } from "./domain/services/claim.service";
import { ClaimDocumentService } from "./domain/services/claim-document.service";
import { ClaimSummaryService } from "./domain/services/claim-summary.service";
import { ClaimEntity } from "./infrastructure/persistence/typeorm/entities/claim.entity";
import { ClaimDocumentEntity } from "./infrastructure/persistence/typeorm/entities/claim-document.entity";
import { ClaimRepositoryTypeOrm } from "./infrastructure/persistence/typeorm/repositories/claim.repository.typeorm";
import { ClaimDocumentRepositoryTypeOrm } from "./infrastructure/persistence/typeorm/repositories/claim-document.repository.typeorm";
import { CloudinaryStorageRepository } from "./infrastructure/storage/cloudinary/storage.repository.cloudinary";
import { OpenAiSummaryRepository } from "./infrastructure/ai/openai/ai-summary.repository.openai";

@Module({
  imports: [TypeOrmModule.forFeature([ClaimEntity, ClaimDocumentEntity]), AuthModule],
  controllers: [ClaimsController, ClaimDocumentsController],
  providers: [
    ClaimService,
    ClaimDocumentService,
    ClaimSummaryService,
    { provide: CLAIM_REPOSITORY, useClass: ClaimRepositoryTypeOrm },
    { provide: CLAIM_DOCUMENT_REPOSITORY, useClass: ClaimDocumentRepositoryTypeOrm },
    { provide: STORAGE_REPOSITORY, useClass: CloudinaryStorageRepository },
    { provide: AI_SUMMARY_REPOSITORY, useClass: OpenAiSummaryRepository },
  ],
})
export class ClaimsModule {}
