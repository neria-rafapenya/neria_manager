import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class ClinicEmailService {
  private readonly logger = new Logger(ClinicEmailService.name);

  constructor(private readonly config: ConfigService) {}

  private buildTransport() {
    const host = this.config.get<string>("CLINIC_SMTP_HOST", "");
    const user = this.config.get<string>("CLINIC_SMTP_USER", "");
    const pass = this.config.get<string>("CLINIC_SMTP_PASS", "");
    if (!host || !user || !pass) {
      return null;
    }
    const port = parseInt(this.config.get<string>("CLINIC_SMTP_PORT", "587"), 10);
    const secure = this.config.get<string>("CLINIC_SMTP_SECURE", "false") === "true";
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendMail(to: string | string[], subject: string, text: string) {
    const transport = this.buildTransport();
    if (!transport) {
      this.logger.warn("SMTP not configured. Skipping email send.");
      return false;
    }
    const from =
      this.config.get<string>("CLINIC_SMTP_FROM", "") ||
      this.config.get<string>("CLINIC_SMTP_USER", "") ||
      "no-reply@clinicflow.local";
    await transport.sendMail({ from, to, subject, text });
    return true;
  }
}
