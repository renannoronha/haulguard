import { Logger } from "@nestjs/common";
import { ConsumerService } from "./consumer.service";
import type { AuditService } from "../audit/audit.service";
import type { AppConfigService } from "src/config/app-config.service";

type SubscriptionMock = {
  on: jest.Mock;
  close: jest.Mock;
  removeAllListeners: jest.Mock;
};

type TopicSubscriptionMock = {
  exists: jest.Mock;
};

type TopicMockInstance = {
  exists: jest.Mock;
  create: jest.Mock;
  subscription: jest.Mock;
  createSubscription: jest.Mock;
};

type PubSubMocks = {
  subscriptionMock: SubscriptionMock;
  subscriptionFn: jest.Mock;
  topicMock: jest.Mock;
  topicMockInstance: TopicMockInstance;
  topicSubscriptionMock: TopicSubscriptionMock;
  PubSubMock: jest.Mock;
};

jest.mock("@google-cloud/pubsub", () => {
  const subscriptionMock: SubscriptionMock = {
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    removeAllListeners: jest.fn(),
  };
  const topicSubscriptionMock: TopicSubscriptionMock = {
    exists: jest.fn().mockResolvedValue([true]),
  };
  const topicMockInstance: TopicMockInstance = {
    exists: jest.fn().mockResolvedValue([true]),
    create: jest.fn().mockResolvedValue([{}]),
    subscription: jest.fn(() => topicSubscriptionMock),
    createSubscription: jest.fn().mockResolvedValue([{}]),
  };
  const topicMock = jest.fn(() => topicMockInstance);
  const subscriptionFn = jest.fn(() => subscriptionMock);
  const PubSubMock = jest.fn(() => ({
    subscription: subscriptionFn,
    topic: topicMock,
  }));
  return {
    PubSub: PubSubMock,
    __mocks: {
      subscriptionMock,
      subscriptionFn,
      topicMock,
      topicMockInstance,
      topicSubscriptionMock,
      PubSubMock,
    },
  };
});

const {
  __mocks: {
    subscriptionMock,
    subscriptionFn,
    topicMock,
    topicMockInstance,
    topicSubscriptionMock,
    PubSubMock,
  },
} = jest.requireMock("@google-cloud/pubsub") as { __mocks: PubSubMocks };

describe("ConsumerService", () => {
  let service: ConsumerService;
  let auditService: { record: jest.Mock };
  let messageHandler: ((message: { data: Buffer; ack: jest.Mock }) => void) | undefined;
  let config: { pubsub: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    topicMock.mockClear();
    topicMockInstance.exists.mockReset();
    topicMockInstance.exists.mockResolvedValue([true]);
    topicMockInstance.create.mockReset();
    topicMockInstance.create.mockResolvedValue([{}]);
    topicMockInstance.createSubscription.mockReset();
    topicMockInstance.createSubscription.mockResolvedValue([{}]);
    topicMockInstance.subscription.mockReset();
    topicMockInstance.subscription.mockImplementation(
      () => topicSubscriptionMock,
    );
    topicSubscriptionMock.exists.mockReset();
    topicSubscriptionMock.exists.mockResolvedValue([true]);
    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    config = {
      pubsub: jest.fn(() => ({
        projectId: "test-project",
        topic: "load.assigned",
        subscription: "load.assigned.sub",
        emulatorHost: undefined,
      })),
    };

    subscriptionMock.on.mockImplementation((event: string, handler: unknown) => {
      if (event === "message") {
        messageHandler = handler as typeof messageHandler;
      }
      return subscriptionMock;
    });

    service = new ConsumerService(
      auditService as unknown as AuditService,
      config as unknown as AppConfigService,
    );
    (service as unknown as { logger: Logger }).logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setContext: jest.fn(),
    } as unknown as Logger;
  });

  it("connects to the configured subscription and processes messages", async () => {
    await service.onModuleInit();

    expect(config.pubsub).toHaveBeenCalledTimes(1);
    expect(topicMock).toHaveBeenCalledWith("load.assigned");
    expect(topicMockInstance.subscription).toHaveBeenCalledWith("load.assigned.sub");
    expect(PubSubMock).toHaveBeenCalledWith({ projectId: "test-project" });
    expect(subscriptionFn).toHaveBeenCalledWith("load.assigned.sub");
    expect(typeof messageHandler).toBe("function");

    const ack = jest.fn();
    const payload = { driverId: 7, loadId: 3 };
    messageHandler?.({
      data: Buffer.from(JSON.stringify(payload)),
      ack,
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(auditService.record).toHaveBeenCalledWith({
      type: "ASSIGNED",
      payload,
    });
    expect(ack).toHaveBeenCalledTimes(1);
  });

  it("creates missing topic and subscription before listening", async () => {
    topicMockInstance.exists.mockResolvedValueOnce([false]);
    topicSubscriptionMock.exists.mockResolvedValueOnce([false]);

    await service.onModuleInit();

    expect(topicMockInstance.create).toHaveBeenCalledTimes(1);
    expect(topicMockInstance.createSubscription).toHaveBeenCalledWith(
      "load.assigned.sub",
    );
  });

  it("acks and skips auditing when payload is invalid", async () => {
    await service.onModuleInit();

    const ack = jest.fn();
    messageHandler?.({
      data: Buffer.from("{\"driverId\":\"oops\"}"),
      ack,
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(auditService.record).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledTimes(1);
  });

  it("closes the subscription on shutdown", async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(subscriptionMock.close).toHaveBeenCalledTimes(1);
    expect(subscriptionMock.removeAllListeners).toHaveBeenCalledTimes(1);
  });
});
