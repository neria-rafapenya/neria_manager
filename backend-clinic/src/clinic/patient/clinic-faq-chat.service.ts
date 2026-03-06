import { Injectable } from "@nestjs/common";
import { AiService } from "../ai/ai.service";
import { ClinicPromptsService } from "../prompts/clinic-prompts.service";
import { FAQ_CHAT_PROMPT_DEFAULT } from "../prompts/default-prompts";

type ChatMessage = { role: "user" | "assistant"; content: string };

@Injectable()
export class ClinicFaqChatService {
  constructor(
    private readonly ai: AiService,
    private readonly prompts: ClinicPromptsService,
  ) {}

  async chat(
    tenantId: string,
    message: string,
    history: ChatMessage[] = [],
  ) {
    const prompt = await this.prompts.getOrCreate(
      tenantId,
      "faq_chat",
      FAQ_CHAT_PROMPT_DEFAULT,
    );

    const trimmedHistory = history.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages = [
      { role: "system" as const, content: prompt.content },
      ...trimmedHistory,
      { role: "user" as const, content: message },
    ];

    const response = await this.ai.chat(messages);
    const reply = response.choices?.[0]?.message?.content?.trim() || "";
    return { reply };
  }
}
