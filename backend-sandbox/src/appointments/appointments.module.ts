import { Module } from "@nestjs/common";
import { DatabaseModule } from "../db/database.module";
import { AppointmentsController } from "./appointments.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
