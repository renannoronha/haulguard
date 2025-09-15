// libs/security/security.module.ts
import { Module } from "@nestjs/common";
import { PasswordService } from "./password.service";
import { AppConfigModule } from "src/config/app-config.module";

@Module({
  imports: [AppConfigModule],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class SecurityModule {}
