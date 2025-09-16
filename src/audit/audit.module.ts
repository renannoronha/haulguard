import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditEventDoc, AuditEventSchema } from "./audit.schema";
import { AppConfigModule } from "src/config/app-config.module";

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forFeature([
      { name: AuditEventDoc.name, schema: AuditEventSchema },
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
