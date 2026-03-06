import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicSettingsEntity } from "../entities/clinic-settings.entity";
import { ClinicServiceEntity } from "../entities/clinic-service.entity";
import { ClinicProtocolEntity } from "../entities/clinic-protocol.entity";
import { ClinicFaqEntryEntity } from "../entities/clinic-faq-entry.entity";
import { ClinicTriageFlowEntity } from "../entities/clinic-triage-flow.entity";
import { ClinicReportTemplateEntity } from "../entities/clinic-report-template.entity";

@Injectable()
export class ClinicSettingsService {
  constructor(
    @InjectRepository(ClinicSettingsEntity)
    private readonly settingsRepo: Repository<ClinicSettingsEntity>,
    @InjectRepository(ClinicServiceEntity)
    private readonly servicesRepo: Repository<ClinicServiceEntity>,
    @InjectRepository(ClinicProtocolEntity)
    private readonly protocolsRepo: Repository<ClinicProtocolEntity>,
    @InjectRepository(ClinicFaqEntryEntity)
    private readonly faqRepo: Repository<ClinicFaqEntryEntity>,
    @InjectRepository(ClinicTriageFlowEntity)
    private readonly triageRepo: Repository<ClinicTriageFlowEntity>,
    @InjectRepository(ClinicReportTemplateEntity)
    private readonly reportsRepo: Repository<ClinicReportTemplateEntity>,
  ) {}

  async getSettings(tenantId: string) {
    const settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (settings) return settings;
    return {
      id: null,
      tenantId,
      name: null,
      legalName: null,
      email: null,
      phone: null,
      address: null,
      timezone: null,
      website: null,
      emergencyDisclaimer: null,
      privacyNotice: null,
      openingHours: null,
      channels: null,
    };
  }

  async updateSettings(tenantId: string, payload: Partial<ClinicSettingsEntity>) {
    const existing = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!existing) {
      const created = this.settingsRepo.create({
        ...payload,
        id: randomUUID(),
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return this.settingsRepo.save(created);
    }
    Object.assign(existing, payload);
    existing.updatedAt = new Date();
    return this.settingsRepo.save(existing);
  }

  listServices(tenantId: string) {
    return this.servicesRepo.find({ where: { tenantId } });
  }

  listProtocols(tenantId: string) {
    return this.protocolsRepo.find({ where: { tenantId } });
  }

  listFaq(tenantId: string) {
    return this.faqRepo.find({ where: { tenantId } });
  }

  listTriage(tenantId: string) {
    return this.triageRepo.find({ where: { tenantId } });
  }

  listReports(tenantId: string) {
    return this.reportsRepo.find({ where: { tenantId } });
  }
}
