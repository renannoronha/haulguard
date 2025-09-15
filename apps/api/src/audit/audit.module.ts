import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { MongoClient } from "mongodb";

export const MONGO_CLIENT = Symbol("MONGO_CLIENT");
export const AUDIT_COLLECTION = Symbol("AUDIT_COLLECTION");

@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      useFactory: async () => {
        const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017";
        const client = new MongoClient(uri);
        await client.connect();
        return client;
      },
    },
    {
      provide: AUDIT_COLLECTION,
      useFactory: (client: MongoClient) => {
        const dbName = process.env.MONGO_DB ?? "haulguard";
        return client.db(dbName).collection("audit_events");
      },
      inject: [MONGO_CLIENT],
    },
    AuditService,
  ],
  exports: [AuditService],
})
export class AuditModule {}
