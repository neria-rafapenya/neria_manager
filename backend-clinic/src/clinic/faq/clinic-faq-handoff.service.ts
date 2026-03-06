import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicFaqHandoffEntity } from "../entities/clinic-faq-handoff.entity";
import { ClinicUserService } from "../clinic-user.service";
import { ClinicSettingsService } from "../settings/clinic-settings.service";
import { ClinicEmailService } from "../notifications/clinic-email.service";

type HandoffMessage = { role: string; content: string };

@Injectable()
export class ClinicFaqHandoffService {
  constructor(
    @InjectRepository(ClinicFaqHandoffEntity)
    private readonly repo: Repository<ClinicFaqHandoffEntity>,
    private readonly userService: ClinicUserService,
    private readonly settingsService: ClinicSettingsService,
    private readonly emailService: ClinicEmailService,
  ) {}

  private normalizeMessages(messages: unknown): HandoffMessage[] {
    if (!Array.isArray(messages)) return [];
    return messages
      .slice(-12)
      .map((entry) => ({
        role: String((entry as any)?.role || "user"),
        content: String((entry as any)?.content || "").slice(0, 2000),
      }))
      .filter((entry) => entry.content.length > 0);
  }

  private async resolveNotificationEmail(tenantId: string) {
    const settings = await this.settingsService.getSettings(tenantId);
    return settings?.email || "";
  }

  private buildEmailText(handoff: ClinicFaqHandoffEntity) {
    const lines = [
      "Solicitud de contacto humano (ClinicFlow)",
      "",
      `Paciente: ${handoff.patientName || handoff.patientEmail || handoff.patientUserId}`,
      `Email: ${handoff.patientEmail || "sin email"}`,
      `Fecha: ${handoff.requestedAt?.toISOString() || ""}`,
      "",
      "Mensajes recientes:",
    ];
    const messages = handoff.messages || [];
    if (messages.length === 0) {
      lines.push("Sin mensajes adjuntos.");
    } else {
      messages.forEach((m) => {
        lines.push(`- ${m.role}: ${m.content}`);
      });
    }
    return lines.join("\n");
  }

  async requestHandoff(
    tenantId: string,
    patientUserId: string,
    messages: unknown,
  ) {
    const patient = await this.userService.getById(tenantId, patientUserId);
    const payload = this.normalizeMessages(messages);
    if (payload.length === 0) {
      throw new BadRequestException("Missing messages");
    }
    const handoff = this.repo.create({
      id: randomUUID(),
      tenantId,
      patientUserId,
      patientEmail: patient.email,
      patientName: patient.name || patient.email,
      status: "open",
      messages: payload,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.repo.save(handoff);
    const email = await this.resolveNotificationEmail(tenantId);
    if (email) {
      await this.emailService.sendMail(
        email,
        "Nueva solicitud de atención humana",
        this.buildEmailText(saved),
      );
    }
    return saved;
  }

  listForTenant(tenantId: string) {
    return this.repo.find({
      where: { tenantId },
      order: { requestedAt: "DESC" },
    });
  }

  listForPatient(tenantId: string, patientUserId: string) {
    return this.repo.find({
      where: { tenantId, patientUserId },
      order: { requestedAt: "DESC" },
    });
  }

  async respond(
    tenantId: string,
    id: string,
    responder: { id: string; name?: string },
    responseText: string,
  ) {
    const handoff = await this.repo.findOne({ where: { tenantId, id } });
    if (!handoff) {
      throw new NotFoundException("Handoff not found");
    }
    if (!responseText?.trim()) {
      throw new BadRequestException("Missing responseText");
    }
    handoff.status = "answered";
    handoff.responseText = responseText.trim();
    handoff.respondedAt = new Date();
    handoff.respondedByUserId = responder.id;
    handoff.respondedByName = responder.name || null;
    handoff.updatedAt = new Date();
    return this.repo.save(handoff);
  }
}
