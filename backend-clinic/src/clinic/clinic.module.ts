import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicAuthModule } from "./auth/clinic-auth.module";
import { ClinicSettingsController } from "./settings/clinic-settings.controller";
import { ClinicSettingsService } from "./settings/clinic-settings.service";
import { ClinicPatientController } from "./patient/clinic-patient.controller";
import { ClinicStaffController } from "./staff/clinic-staff.controller";
import { ClinicAdminController } from "./admin/clinic-admin.controller";
import { ClinicUserService } from "./clinic-user.service";
import { ClinicPatientService } from "./clinic-patient.service";
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
    ]),
    ClinicAuthModule,
    AiModule,
  ],
  controllers: [
    ClinicSettingsController,
    ClinicPatientController,
    ClinicStaffController,
    ClinicAdminController,
  ],
  providers: [ClinicSettingsService, ClinicUserService, ClinicPatientService],
})
export class ClinicModule {}
