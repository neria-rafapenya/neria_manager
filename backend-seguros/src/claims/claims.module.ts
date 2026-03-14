import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AI_SUMMARY_REPOSITORY,
  AI_COMMUNICATION_REPOSITORY,
  CLAIM_DOCUMENT_REPOSITORY,
  CLAIM_DOCUMENT_REQUEST_REPOSITORY,
  CLAIM_REPOSITORY,
  STORAGE_REPOSITORY,
} from "./claims.constants";
import { ClaimsController } from "./adapters/in/http/claims.controller";
import { ClaimDocumentsController } from "./adapters/in/http/documents.controller";
import { ClaimService } from "./domain/services/claim.service";
import { ClaimDocumentService } from "./domain/services/claim-document.service";
import { ClaimDocumentRequestService } from "./domain/services/claim-document-request.service";
import { ClaimCommunicationService } from "./domain/services/claim-communication.service";
import { ClaimSummaryService } from "./domain/services/claim-summary.service";
import { ClaimEntity } from "./infrastructure/persistence/typeorm/entities/claim.entity";
import { ClaimDocumentEntity } from "./infrastructure/persistence/typeorm/entities/claim-document.entity";
import { ClaimDocumentRequestEntity } from "./infrastructure/persistence/typeorm/entities/claim-document-request.entity";
import { ClaimRepositoryTypeOrm } from "./infrastructure/persistence/typeorm/repositories/claim.repository.typeorm";
import { ClaimDocumentRepositoryTypeOrm } from "./infrastructure/persistence/typeorm/repositories/claim-document.repository.typeorm";
import { ClaimDocumentRequestRepositoryTypeOrm } from "./infrastructure/persistence/typeorm/repositories/claim-document-request.repository.typeorm";
import { CloudinaryStorageRepository } from "./infrastructure/storage/cloudinary/storage.repository.cloudinary";
import { OpenAiSummaryRepository } from "./infrastructure/ai/openai/ai-summary.repository.openai";
import { OpenAiCommunicationRepository } from "./infrastructure/ai/openai/ai-communication.repository.openai";

@Module({
  imports: [TypeOrmModule.forFeature([ClaimEntity, ClaimDocumentEntity, ClaimDocumentRequestEntity]), AuthModule],
  controllers: [ClaimsController, ClaimDocumentsController],
  providers: [
    ClaimService,
    ClaimDocumentService,
    ClaimDocumentRequestService,
    ClaimCommunicationService,
    ClaimSummaryService,
    { provide: CLAIM_REPOSITORY, useClass: ClaimRepositoryTypeOrm },
    { provide: CLAIM_DOCUMENT_REPOSITORY, useClass: ClaimDocumentRepositoryTypeOrm },
    { provide: CLAIM_DOCUMENT_REQUEST_REPOSITORY, useClass: ClaimDocumentRequestRepositoryTypeOrm },
    { provide: STORAGE_REPOSITORY, useClass: CloudinaryStorageRepository },
    { provide: AI_SUMMARY_REPOSITORY, useClass: OpenAiSummaryRepository },
    { provide: AI_COMMUNICATION_REPOSITORY, useClass: OpenAiCommunicationRepository },
  ],
})
export class ClaimsModule {}
