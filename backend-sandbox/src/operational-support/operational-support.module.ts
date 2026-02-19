import { Module } from "@nestjs/common";
import { DatabaseModule } from "../db/database.module";
import { OperationalSupportController } from "./operational-support.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [OperationalSupportController],
})
export class OperationalSupportModule {}
