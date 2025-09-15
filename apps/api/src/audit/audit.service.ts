import { Inject, Injectable } from "@nestjs/common";
import type { Collection, Document } from "mongodb";
import { AUDIT_COLLECTION } from "./audit.module";

export type AuditEvent = {
  type: string;
  payload: unknown;
  timestamp?: Date;
};

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_COLLECTION)
    private readonly collection: Collection<Document>,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    const { type, payload } = event;
    const timestamp = event.timestamp ?? new Date();
    await this.collection.insertOne({ type, payload, timestamp });
  }
}
