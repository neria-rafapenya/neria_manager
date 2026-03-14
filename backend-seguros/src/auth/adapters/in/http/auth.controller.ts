import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AuthService } from "../../../domain/services/auth.service";
import { UserService } from "../../../domain/services/user.service";
import { LoginDto } from "../../../ui/dto/login.dto";
import { CreateUserDto } from "../../../ui/dto/create-user.dto";
import { RegisterDto } from "../../../ui/dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post("register")
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.createUser(body.email, "user", body.password);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Post("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async createUser(@Body() body: CreateUserDto) {
    const user = await this.authService.createUser(body.email, body.role, body.password);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async listUsers(@Query("role") role?: string) {
    if (role && role !== "agente") {
      return [];
    }
    const users = await this.userService.listAgents();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
    }));
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { sub: string; email: string; role: string }) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }
}
