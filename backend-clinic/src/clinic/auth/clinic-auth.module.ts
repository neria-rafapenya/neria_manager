import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicUserEntity } from "../entities/clinic-user.entity";
import { ClinicAuthController } from "./clinic-auth.controller";
import { ClinicAuthService } from "./clinic-auth.service";
import { PasswordService } from "./password.service";
import { ClinicJwtStrategy } from "./clinic-jwt.strategy";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([ClinicUserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("CLINIC_JWT_SECRET", ""),
        signOptions: {
          expiresIn: config.get<string>("CLINIC_JWT_TTL", "7200"),
        },
      }),
    }),
  ],
  controllers: [ClinicAuthController],
  providers: [ClinicAuthService, PasswordService, ClinicJwtStrategy],
  exports: [ClinicAuthService, PasswordService, JwtModule],
})
export class ClinicAuthModule {}
