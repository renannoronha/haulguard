import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Message, PubSub, Subscription } from "@google-cloud/pubsub";
import { AuditService } from "../audit/audit.service";
import { AppConfigService } from "src/config/app-config.service";

@Injectable()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsumerService.name);
  private readonly projectId: string;
  private readonly subscriptionName: string;
  private readonly topicName: string;
  private readonly pubsub: PubSub;
  private subscription?: Subscription;

  constructor(
    private readonly auditService: AuditService,
    private readonly config: AppConfigService,
  ) {
    const pubsubConfig = this.config.pubsub();
    this.projectId = pubsubConfig.projectId;
    this.subscriptionName = pubsubConfig.subscription;
    this.topicName = pubsubConfig.topic;
    const options: ConstructorParameters<typeof PubSub>[0] = {
      projectId: this.projectId,
    };
    if (pubsubConfig.emulatorHost) {
      options.apiEndpoint = pubsubConfig.emulatorHost;
    }
    this.pubsub = new PubSub(options);
  }

  async onModuleInit(): Promise<void> {
    await this.ensureSubscription();
    this.subscription = this.pubsub.subscription(this.subscriptionName);
    this.subscription.on("message", (message) => {
      void this.handleMessage(message);
    });
    this.subscription.on("error", (error) => {
      this.logger.error("Subscription error", error.stack ?? error.message);
    });
    this.logger.log(
      `Listening for messages on subscription ${this.subscriptionName} (project: ${this.projectId})`,
    );
  }

  private async ensureSubscription(): Promise<void> {
    const topic = this.pubsub.topic(this.topicName);
    const [topicExists] = await topic.exists();
    if (!topicExists) {
      await topic.create();
      this.logger.log(`Created missing topic ${this.topicName}`);
    }

    const subscription = topic.subscription(this.subscriptionName);
    const [subscriptionExists] = await subscription.exists();
    if (!subscriptionExists) {
      await topic.createSubscription(this.subscriptionName);
      this.logger.log(
        `Created missing subscription ${this.subscriptionName} bound to topic ${this.topicName}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscription) {
      await this.subscription.close();
      this.subscription.removeAllListeners();
    }
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      const payload = this.parsePayload(message);
      await this.auditService.record({
        type: payload.type,
        payload: payload.payload,
      });
      this.logger.debug(
        `Processed load.assigned message for type=${payload.type} and payload=${JSON.stringify(payload.payload)}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        "Failed to process load.assigned message",
        err.stack ?? err.message,
      );
    } finally {
      message.ack();
    }
  }

  private parsePayload(message: Message): { type: string; payload: unknown } {
    const content = message.data.toString();
    const messagePayload = JSON.parse(content) as Partial<{
      type: string;
      payload: unknown;
    }>;
    const { type, payload } = messagePayload;

    if (!type) {
      throw new Error("Message payload missing required 'type' property");
    }

    return { type, payload };
  }
}
