import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicAuthModule } from "./auth/clinic-auth.module";
import { ClinicSettingsController } from "./settings/clinic-settings.controller";
import { ClinicSettingsService } from "./settings/clinic-settings.service";
import { ClinicPatientController } from "./patient/clinic-patient.controller";
import { ClinicStaffController } from "./staff/clinic-staff.controller";
import { ClinicAdminController } from "./admin/clinic-admin.controller";
import { ClinicAvailabilityController } from "./availability/clinic-availability.controller";
import { ClinicUserService } from "./clinic-user.service";
import { ClinicPatientService } from "./clinic-patient.service";
import { ClinicAvailabilityService } from "./availability/clinic-availability.service";
import { ClinicTimeOffService } from "./time-off/clinic-time-off.service";
import { AiModule } from "./ai/ai.module";
import { ClinicSettingsEntity } from "./entities/clinic-settings.entity";
import { ClinicServiceEntity } from "./entities/clinic-service.entity";
import { ClinicProtocolEntity } from "./entities/clinic-protocol.entity";
import { ClinicFaqEntryEntity } from "./entities/clinic-faq-entry.entity";
import { ClinicTriageFlowEntity } from "./entities/clinic-triage-flow.entity";
import { ClinicReportTemplateEntity } from "./entities/clinic-report-template.entity";
import { ClinicUserEntity } from "./entities/clinic-user.entity";
import { ClinicPatientInteractionEntity } from "./entities/clinic-patient-interaction.entity";
import { ClinicPatientAppointmentEntity } from "./entities/clinic-patient-appointment.entity";
import { ClinicPatientDocumentEntity } from "./entities/clinic-patient-document.entity";
import { ClinicPatientTreatmentEntity } from "./entities/clinic-patient-treatment.entity";
import { ClinicPatientTreatmentReportEntity } from "./entities/clinic-patient-treatment-report.entity";
import { ClinicPatientPreferenceEntity } from "./entities/clinic-patient-preference.entity";
import { ClinicAvailabilityEntity } from "./entities/clinic-availability.entity";
import { ClinicTimeOffEntity } from "./entities/clinic-time-off.entity";
import { ClinicTimeOffController } from "./time-off/clinic-time-off.controller";
import { ClinicPatientPreferenceService } from "./patient/clinic-patient-preference.service";
import { ClinicVisitChatService } from "./patient/clinic-visit-chat.service";
import { CloudinaryService } from "./storage/cloudinary.service";
import { ClinicHolidayEntity } from "./holidays/clinic-holiday.entity";
import { ClinicHolidaysService } from "./holidays/clinic-holidays.service";
import { ClinicHolidaysController } from "./holidays/clinic-holidays.controller";
import { ClinicPromptEntity } from "./prompts/clinic-prompt.entity";
import { ClinicPromptsService } from "./prompts/clinic-prompts.service";
import { ClinicFaqChatService } from "./patient/clinic-faq-chat.service";
import { ClinicPromptsController } from "./prompts/clinic-prompts.controller";
import { ClinicFaqLogEntity } from "./entities/clinic-faq-log.entity";
import { ClinicFaqHandoffEntity } from "./entities/clinic-faq-handoff.entity";
import { ClinicFaqLogService } from "./faq/clinic-faq-log.service";
import { ClinicFaqHandoffService } from "./faq/clinic-faq-handoff.service";
import { ClinicEmailService } from "./notifications/clinic-email.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicSettingsEntity,
      ClinicServiceEntity,
      ClinicProtocolEntity,
      ClinicFaqEntryEntity,
      ClinicTriageFlowEntity,
      ClinicReportTemplateEntity,
      ClinicUserEntity,
      ClinicPatientInteractionEntity,
      ClinicPatientAppointmentEntity,
      ClinicPatientDocumentEntity,
      ClinicPatientTreatmentEntity,
      ClinicPatientTreatmentReportEntity,
      ClinicPatientPreferenceEntity,
      ClinicAvailabilityEntity,
      ClinicTimeOffEntity,
      ClinicHolidayEntity,
      ClinicPromptEntity,
      ClinicFaqLogEntity,
      ClinicFaqHandoffEntity,
    ]),
    ClinicAuthModule,
    AiModule,
  ],
  controllers: [
    ClinicSettingsController,
    ClinicPatientController,
    ClinicStaffController,
    ClinicAdminController,
    ClinicAvailabilityController,
    ClinicTimeOffController,
    ClinicHolidaysController,
    ClinicPromptsController,
  ],
  providers: [
    ClinicSettingsService,
    ClinicUserService,
    ClinicPatientService,
    ClinicAvailabilityService,
    ClinicTimeOffService,
    ClinicHolidaysService,
    ClinicPatientPreferenceService,
    ClinicVisitChatService,
    ClinicFaqChatService,
    CloudinaryService,
    ClinicPromptsService,
    ClinicFaqLogService,
    ClinicFaqHandoffService,
    ClinicEmailService,
  ],
})
export class ClinicModule {}
