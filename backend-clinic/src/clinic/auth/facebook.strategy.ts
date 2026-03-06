import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-facebook";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>("FACEBOOK_APP_ID", "");
    const clientSecret = config.get<string>("FACEBOOK_APP_SECRET", "");
    const baseUrl = config.get<string>("OAUTH_CALLBACK_BASE_URL", "");
    super({
      clientID,
      clientSecret,
      callbackURL: `${baseUrl}/clinicflow/auth/facebook/callback`,
      scope: ["email", "public_profile"],
      profileFields: ["id", "displayName", "emails"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ) {
    const email = profile.emails?.[0]?.value?.toLowerCase() ?? "";
    const name = profile.displayName || "";
    return { email, name, provider: "facebook" };
  }
}
