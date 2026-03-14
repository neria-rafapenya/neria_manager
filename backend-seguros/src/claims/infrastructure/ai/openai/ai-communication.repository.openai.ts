import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type {
  AiCommunicationRepository,
  DocumentRequestAiInput,
  UserExplanationAiInput,
} from "../../../domain/repositories/ai-communication.repository";

@Injectable()
export class OpenAiCommunicationRepository implements AiCommunicationRepository {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    const baseURL = this.configService.get<string>("OPENAI_BASE_URL");
    this.model = this.configService.get<string>("OPENAI_MODEL", "gpt-4.1-mini");

    this.client = new OpenAI({ apiKey, baseURL });
  }

  async generateDocumentRequestMessage(input: DocumentRequestAiInput): Promise<string> {
    const prompt = `Eres un asistente de siniestros. Redacta un mensaje breve y claro para pedir un documento a un cliente.
Documento solicitado: ${input.documentKind}
Numero de expediente: ${input.claimNumber}
Ramo: ${input.type}
Fecha siniestro: ${input.lossDate ? input.lossDate.toISOString().slice(0, 10) : "-"}
Descripcion: ${input.description ?? "-"}
Poliza: ${input.policyNumber ?? "-"}
Urgencia: ${input.urgency ? "alta" : "normal"}
Terceros: ${input.thirdPartyInvolved ? "si" : "no"}
Notas del operador: ${input.operatorNotes ?? "-"}

Requisitos:
- 2 a 4 frases maximo.
- Indica por que es necesario el documento.
- Indica formato recomendado (foto o PDF legible).
- Tono profesional y amable.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  async generateUserExplanation(input: UserExplanationAiInput): Promise<string> {
    const pending = input.pendingDocuments.length ? input.pendingDocuments.join(", ") : "ninguno";
    const prompt = `Eres un asistente de siniestros. Explica el estado del expediente al cliente final en espanol.
Numero de expediente: ${input.claimNumber}
Ramo: ${input.type}
Estado: ${input.status}
Completitud: ${input.completenessStatus}
Fecha siniestro: ${input.lossDate ? input.lossDate.toISOString().slice(0, 10) : "-"}
Documentos pendientes: ${pending}

Requisitos:
- 3 a 5 lineas maximo.
- Explica que esta pasando y el siguiente paso.
- Si faltan documentos, pide accion concreta y breve.
- Tono claro, empatico y sin jerga tecnica.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }
}

