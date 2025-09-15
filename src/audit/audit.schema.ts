import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ collection: "audit_events" })
export class AuditEventDoc {
  @Prop({ required: true })
  type: string;

  @Prop({ type: Object })
  payload: any;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export type AuditEventDocument = HydratedDocument<AuditEventDoc>;
export const AuditEventSchema = SchemaFactory.createForClass(AuditEventDoc);
