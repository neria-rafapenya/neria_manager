import { BadRequestException, Body, Controller, Headers, Post } from "@nestjs/common";
import { ClinicAuthService } from "./clinic-auth.service";

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

@Controller("/clinicflow/auth")
export class ClinicAuthController {
  constructor(private readonly authService: ClinicAuthService) {}

  @Post("/login")
  async login(@Headers("x-tenant-id") headerTenant: string, @Body() body: LoginRequest) {
    const tenantId = headerTenant || body?.tenantId;
    if (!tenantId) {
      throw new BadRequestException("Missing tenant");
    }
    if (!body?.email || !body?.password) {
      throw new BadRequestException("Email and password required");
    }
    return this.authService.login(tenantId, body.email.trim().toLowerCase(), body.password);
  }
}
