import { Module } from "@nestjs/common";
import { TaxAssistantController } from "./tax-assistant.controller";
import { DatabaseModule } from "../db/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [TaxAssistantController],
})
export class TaxAssistantModule {}
