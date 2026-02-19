import { Module } from "@nestjs/common";
import { DatabaseModule } from "../db/database.module";
import { ChatSqlController } from "./chat-sql.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [ChatSqlController],
})
export class ChatSqlModule {}
