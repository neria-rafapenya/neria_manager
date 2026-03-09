import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { USER_REPOSITORY } from "./auth.constants";
import { AuthController } from "./adapters/in/http/auth.controller";
import { AuthService } from "./domain/services/auth.service";
import { UserService } from "./domain/services/user.service";
import { UserEntity } from "./infrastructure/persistence/typeorm/entities/user.entity";
import { UserRepositoryTypeOrm } from "./infrastructure/persistence/typeorm/repositories/user.repository.typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    { provide: USER_REPOSITORY, useClass: UserRepositoryTypeOrm },
  ],
  exports: [AuthService],
})
export class AuthModule {}
