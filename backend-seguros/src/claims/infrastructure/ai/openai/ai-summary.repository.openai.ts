import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import {
  AiSummaryRepository,
  ClaimSummaryInput,
} from "../../../domain/repositories/ai-summary.repository";

@Injectable()
export class OpenAiSummaryRepository implements AiSummaryRepository {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(OpenAiSummaryRepository.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    const baseURL = this.configService.get<string>("OPENAI_BASE_URL");
    this.model = this.configService.get<string>("OPENAI_MODEL", "gpt-4.1-mini");

    this.client = new OpenAI({ apiKey, baseURL });
  }

  async summarizeClaim(input: ClaimSummaryInput): Promise<string> {
    const docList = input.documents
      .map((doc) => `- ${doc.kind}: ${doc.filename}`)
      .join("\n");

    const lossDate =
      input.lossDate instanceof Date
        ? input.lossDate
        : input.lossDate
          ? new Date(input.lossDate)
          : null;

    const prompt = `Eres un asistente de siniestros. Redacta un resumen operativo en espanol para un tramitador.
Numero: ${input.claimNumber}
Ramo: ${input.type}
Fecha siniestro: ${lossDate ? lossDate.toISOString().slice(0, 10) : "-"}
Descripcion: ${input.description ?? "-"}
Documentos:\n${docList || "-"}

Formato:
- Resumen (2-3 lineas)
- Riesgos o alertas (1-2 lineas)
- Proximos pasos sugeridos (1-2 lineas)
Usa frases cortas, claras y accionables.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      return response.choices[0]?.message?.content?.trim() ?? "";
    } catch (error) {
      const err = error as { message?: string; status?: number; code?: string };
      this.logger.error(
        `OpenAI summary failed (model=${this.model}) status=${err.status ?? "unknown"} code=${
          err.code ?? "unknown"
        } message=${err.message ?? "unknown"}`,
      );
      throw error;
    }
  }
}
