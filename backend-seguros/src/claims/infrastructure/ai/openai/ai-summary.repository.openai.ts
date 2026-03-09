import { Injectable } from "@nestjs/common";
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

    const prompt = `Eres un asistente de siniestros. Redacta un resumen operativo en espanol para un tramitador.
Numero: ${input.claimNumber}
Ramo: ${input.type}
Fecha siniestro: ${input.lossDate ? input.lossDate.toISOString().slice(0, 10) : "-"}
Descripcion: ${input.description ?? "-"}
Documentos:\n${docList || "-"}

Devuelve 5-7 lineas claras y accionables.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }
}
