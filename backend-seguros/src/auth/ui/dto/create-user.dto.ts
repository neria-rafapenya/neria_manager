import { IsEmail, IsIn, IsString } from "class-validator";
import { USER_ROLES } from "../../domain/entities/user";
import type { UserRole } from "../../domain/entities/user";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsIn(USER_ROLES)
  role!: UserRole;

  @IsString()
  password!: string;
}
