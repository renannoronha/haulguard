import { Injectable } from "@nestjs/common";
import { PubSub } from "@google-cloud/pubsub";

@Injectable()
export class PublisherService {
  private readonly pubsub: PubSub;
  private readonly projectId: string;

  constructor() {
    this.projectId = process.env.PUBSUB_PROJECT_ID ?? "";
    // If PUBSUB_EMULATOR_HOST is set, the SDK uses the emulator automatically
    this.pubsub = new PubSub({ projectId: this.projectId });
  }

  async publish(topic: string, data: unknown): Promise<string> {
    const buffer = Buffer.from(JSON.stringify(data));
    const topicRef = this.pubsub.topic(topic);
    const messageId = await topicRef.publishMessage({ data: buffer });
    return messageId;
  }

  async publishLoadAssigned(payload: { driverId: number; loadId: number }) {
    return this.publish("load.assigned", payload);
  }
}
