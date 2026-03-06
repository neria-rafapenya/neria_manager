import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ClinicJwtPayload } from "./clinic-auth.utils";

@Injectable()
export class ClinicJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("CLINIC_JWT_SECRET", ""),
    });
  }

  validate(payload: ClinicJwtPayload) {
    return payload;
  }
}
