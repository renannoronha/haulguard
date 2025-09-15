import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuditEventDoc, AuditEventDocument } from "./audit.schema";

export type AuditEvent = {
  type: string;
  payload: unknown;
  timestamp?: Date;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEventDoc.name)
    private readonly model: Model<AuditEventDocument>,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    const { type, payload } = event;
    const timestamp = event.timestamp ?? new Date();
    await this.model.create({ type, payload, timestamp });
  }
}
