import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditEventDoc, AuditEventSchema } from "./audit.schema";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
        dbName: process.env.MONGO_DB ?? "haulguard",
      }),
    }),
    MongooseModule.forFeature([
      { name: AuditEventDoc.name, schema: AuditEventSchema },
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
