import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicFaqLogEntity } from "../entities/clinic-faq-log.entity";

@Injectable()
export class ClinicFaqLogService {
  constructor(
    @InjectRepository(ClinicFaqLogEntity)
    private readonly repo: Repository<ClinicFaqLogEntity>,
  ) {}

  async createLog(tenantId: string, patientUserId: string) {
    const log = this.repo.create({
      id: randomUUID(),
      tenantId,
      patientUserId,
      createdAt: new Date(),
    });
    return this.repo.save(log);
  }

  listForPatient(tenantId: string, patientUserId: string, limit = 20) {
    return this.repo.find({
      where: { tenantId, patientUserId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  listForTenant(tenantId: string, limit = 100) {
    return this.repo.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
