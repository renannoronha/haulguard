import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditEventDoc, AuditEventSchema } from "./audit.schema";
import { AppConfigModule } from "src/config/app-config.module";
import { AppConfigService } from "src/config/app-config.service";

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const mongo = config.mongo();
        return {
          uri: mongo.uri,
          dbName: mongo.dbName,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: AuditEventDoc.name, schema: AuditEventSchema },
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
