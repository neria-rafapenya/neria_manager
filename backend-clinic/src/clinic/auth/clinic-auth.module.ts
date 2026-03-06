import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { StringValue } from "ms";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicUserEntity } from "../entities/clinic-user.entity";
import { ClinicAuthController } from "./clinic-auth.controller";
import { ClinicAuthService } from "./clinic-auth.service";
import { PasswordService } from "./password.service";
import { ClinicJwtStrategy } from "./clinic-jwt.strategy";
import { GoogleStrategy } from "./google.strategy";
import { FacebookStrategy } from "./facebook.strategy";
import { GoogleAuthGuard } from "./google-auth.guard";
import { FacebookAuthGuard } from "./facebook-auth.guard";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([ClinicUserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>("CLINIC_JWT_TTL", "7200");
        const ttlValue = /^\d+$/.test(raw) ? Number(raw) : (raw as StringValue);
        return {
          secret: config.get<string>("CLINIC_JWT_SECRET", ""),
          signOptions: {
            expiresIn: ttlValue,
          },
        };
      },
    }),
  ],
  controllers: [ClinicAuthController],
  providers: [
    ClinicAuthService,
    PasswordService,
    ClinicJwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    GoogleAuthGuard,
    FacebookAuthGuard,
  ],
  exports: [ClinicAuthService, PasswordService, JwtModule],
})
export class ClinicAuthModule {}
