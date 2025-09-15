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
  private readonly pubsub: PubSub;
  private subscription?: Subscription;

  constructor(
    private readonly auditService: AuditService,
    private readonly config: AppConfigService,
  ) {
    const pubsubConfig = this.config.pubsub();
    this.projectId = pubsubConfig.projectId;
    this.subscriptionName = pubsubConfig.subscription;
    this.pubsub = new PubSub({ projectId: this.projectId });
  }

  onModuleInit(): void {
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
        type: "ASSIGNED",
        payload,
      });
      this.logger.debug(
        `Processed load.assigned message for driver ${payload.driverId} and load ${payload.loadId}`,
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

  private parsePayload(message: Message): { driverId: number; loadId: number } {
    const content = message.data.toString();
    const payload = JSON.parse(content) as Partial<{
      driverId: unknown;
      loadId: unknown;
    }>;
    const { driverId, loadId } = payload;

    if (typeof driverId !== "number" || typeof loadId !== "number") {
      throw new Error("Invalid load.assigned message payload");
    }

    return { driverId, loadId };
  }
}
