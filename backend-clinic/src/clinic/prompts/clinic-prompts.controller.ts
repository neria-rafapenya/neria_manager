import { Body, Controller, Get, Param, Put, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ClinicAuthGuard } from "../auth/clinic-auth.guard";
import { requireClinicAuth, requireClinicRole } from "../auth/clinic-auth.utils";
import type { ClinicJwtPayload } from "../auth/clinic-auth.utils";
import { ClinicPromptsService } from "./clinic-prompts.service";
import { FAQ_CHAT_PROMPT_DEFAULT } from "./default-prompts";

type AuthRequest = Request & { user?: ClinicJwtPayload };

@Controller("/clinicflow/staff/prompts")
@UseGuards(ClinicAuthGuard)
export class ClinicPromptsController {
  constructor(private readonly prompts: ClinicPromptsService) {}

  @Get("/:key")
  getPrompt(@Req() req: AuthRequest, @Param("key") key: string) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    const fallback = key === "faq_chat" ? FAQ_CHAT_PROMPT_DEFAULT : "";
    return this.prompts.getOrCreate(user.tenantId, key, fallback);
  }

  @Put("/:key")
  updatePrompt(@Req() req: AuthRequest, @Param("key") key: string, @Body() body: any) {
    const user = requireClinicAuth(req.user as ClinicJwtPayload);
    requireClinicRole(user, "manager", "staff");
    const content = body?.content?.toString() || "";
    return this.prompts.upsert(user.tenantId, key, content);
  }
}
