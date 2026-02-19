import { Module } from "@nestjs/common";
import { DatabaseModule } from "../db/database.module";
import { FinancialController } from "./financial.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [FinancialController],
})
export class FinancialModule {}
