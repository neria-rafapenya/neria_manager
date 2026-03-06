import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>("GOOGLE_CLIENT_ID", "");
    const clientSecret = config.get<string>("GOOGLE_CLIENT_SECRET", "");
    const baseUrl = config.get<string>("OAUTH_CALLBACK_BASE_URL", "");
    super({
      clientID,
      clientSecret,
      callbackURL: `${baseUrl}/clinicflow/auth/google/callback`,
      scope: ["profile", "email"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value?.toLowerCase() ?? "";
    const name = profile.displayName || "";
    return { email, name, provider: "google" };
  }
}
