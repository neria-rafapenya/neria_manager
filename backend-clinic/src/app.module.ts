import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { ClinicModule } from "./clinic/clinic.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "mysql",
        host: config.get<string>("DB_HOST", "localhost"),
        port: parseInt(config.get<string>("DB_PORT", "3306"), 10),
        username: config.get<string>("DB_USER", "root"),
        password: config.get<string>("DB_PASSWORD", ""),
        database: config.get<string>("DB_NAME", "provider_manager"),
        entities: [join(__dirname, "**", "*.entity.{ts,js}")],
        synchronize: false,
      }),
    }),
    ClinicModule,
  ],
})
export class AppModule {}
