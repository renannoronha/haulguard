import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ConsumerService } from "./consumer.service";
import { AppConfigModule } from "src/config/app-config.module";

@Module({
  imports: [AuditModule, AppConfigModule],
  providers: [ConsumerService],
})
export class ConsumerModule {}
