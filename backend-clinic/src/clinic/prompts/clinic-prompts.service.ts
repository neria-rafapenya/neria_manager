import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicPromptEntity } from "./clinic-prompt.entity";

@Injectable()
export class ClinicPromptsService {
  constructor(
    @InjectRepository(ClinicPromptEntity)
    private readonly repo: Repository<ClinicPromptEntity>,
  ) {}

  async getOrCreate(tenantId: string, key: string, defaultContent: string) {
    const existing = await this.repo.findOne({ where: { tenantId, key } });
    if (existing) return existing;
    const prompt = this.repo.create({
      id: randomUUID(),
      tenantId,
      key,
      content: defaultContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repo.save(prompt);
  }

  async upsert(tenantId: string, key: string, content: string) {
    const existing = await this.repo.findOne({ where: { tenantId, key } });
    if (existing) {
      existing.content = content;
      existing.updatedAt = new Date();
      return this.repo.save(existing);
    }
    const prompt = this.repo.create({
      id: randomUUID(),
      tenantId,
      key,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repo.save(prompt);
  }
}
