import { Injectable } from "@nestjs/common";
import { PubSub } from "@google-cloud/pubsub";
import { AppConfigService } from "src/config/app-config.service";

@Injectable()
export class PublisherService {
  private readonly pubsub: PubSub;
  private readonly projectId: string;
  private readonly topic: string;

  constructor(private readonly config: AppConfigService) {
    const pubsub = this.config.pubsub();
    this.projectId = pubsub.projectId;
    this.topic = pubsub.topic;
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
    return this.publish(this.topic, payload);
  }
}
