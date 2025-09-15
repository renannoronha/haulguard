import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ConsumerService } from "./consumer.service";

@Module({
  imports: [AuditModule],
  providers: [ConsumerService],
})
export class ConsumerModule {}
