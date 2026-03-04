import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY", "");
    const baseURL = this.config.get<string>("OPENAI_BASE_URL", "");
    this.model = this.config.get<string>("OPENAI_MODEL", "gpt-4.1-mini");
    this.client = new OpenAI({ apiKey, baseURL: baseURL || undefined });
  }

  async chat(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
    return this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.2,
    });
  }
}
