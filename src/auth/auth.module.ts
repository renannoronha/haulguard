import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "src/users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { SecurityModule } from "libs/security/security.module";
import { AppConfigModule } from "src/config/app-config.module";
import { AppConfigService } from "src/config/app-config.service";

@Module({
  imports: [
    AppConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        global: true,
        secret: config.jwt().secret,
        signOptions: { expiresIn: "24h" },
      }),
    }),
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
})
export class AuthModule {}
