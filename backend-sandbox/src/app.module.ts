import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth/auth.guard";
import { DatabaseModule } from "./db/database.module";
import { ChatSqlModule } from "./chat-sql/chat-sql.module";
import { OperationalSupportModule } from "./operational-support/operational-support.module";
import { FinancialModule } from "./financial/financial.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { TaxAssistantModule } from "./tax-assistant/tax-assistant.module";

@Module({
  imports: [
    DatabaseModule,
    ChatSqlModule,
    OperationalSupportModule,
    FinancialModule,
    AppointmentsModule,
    TaxAssistantModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
