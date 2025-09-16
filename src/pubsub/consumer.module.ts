import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ConsumerService } from "./consumer.service";
import { AppConfigModule } from "src/config/app-config.module";
import { MongooseModule } from "@nestjs/mongoose";
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
    AuditModule,
  ],
  providers: [ConsumerService],
})
export class ConsumerModule {}
