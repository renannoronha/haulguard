import { INestApplicationContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConsumerModule } from "../src/pubsub/consumer.module";
import { AppConfigService } from "../src/config/app-config.service";
import { AuditService } from "../src/audit/audit.service";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { AuditEventDoc } from "../src/audit/audit.schema";
import { ConsumerService } from "../src/pubsub/consumer.service";

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

describe("ConsumerModule integration", () => {
  let app: INestApplicationContext;
  let service: ConsumerService;
  const auditMock = { record: jest.fn(), findAll: jest.fn() };
  const configStub = {
    pubsub: jest.fn(() => ({
      projectId: "test-project",
      topic: "load.assigned",
      subscription: "load.assigned.sub",
      emulatorHost: "localhost:8085",
    })),
    mongo: jest.fn(() => ({
      uri: "mongodb://localhost:27017",
      dbName: "haulguard-test",
    })),
  } satisfies Pick<AppConfigService, "pubsub" | "mongo">;

  beforeEach(async () => {
    const mongooseConnectionMock = {
      close: jest.fn(),
      asPromise: jest.fn(),
      models: {},
      model: jest.fn(() => ({})),
    };

    const moduleBuilder = Test.createTestingModule({
      imports: [ConsumerModule],
    });

    moduleBuilder.overrideProvider(AppConfigService).useValue(configStub);
    moduleBuilder.overrideProvider(AuditService).useValue(auditMock);
    moduleBuilder
      .overrideProvider(getConnectionToken())
      .useValue(mongooseConnectionMock);
    moduleBuilder
      .overrideProvider(getModelToken(AuditEventDoc.name))
      .useValue({});

    const moduleRef = await moduleBuilder.compile();
    app = moduleRef;
    service = app.get(ConsumerService);

    topicMockInstance.exists.mockResolvedValue([true]);
    topicMockInstance.create.mockResolvedValue([{}]);
    topicMockInstance.createSubscription.mockResolvedValue([{}]);
    topicMockInstance.subscription.mockImplementation(() => topicSubscriptionMock);
    topicSubscriptionMock.exists.mockResolvedValue([true]);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it("wires Pub/Sub subscription and processes messages", async () => {
    let messageHandler: ((message: { data: Buffer; ack: jest.Mock }) => void) | undefined;
    subscriptionMock.on.mockImplementation((event: string, handler: unknown) => {
      if (event === "message") {
        messageHandler = handler as typeof messageHandler;
      }
      return subscriptionMock;
    });

    await service.onModuleInit();

    expect(configStub.pubsub).toHaveBeenCalledTimes(1);
    expect(PubSubMock).toHaveBeenCalledWith({
      projectId: "test-project",
      apiEndpoint: "localhost:8085",
    });
    expect(topicMock).toHaveBeenCalledWith("load.assigned");
    expect(topicMockInstance.subscription).toHaveBeenCalledWith(
      "load.assigned.sub",
    );
    expect(subscriptionFn).toHaveBeenCalledWith("load.assigned.sub");
    expect(typeof messageHandler).toBe("function");

    const ack = jest.fn();
    const payload = { driverId: 9, loadId: 4 };
    const event = { type: "ASSIGNED", payload };
    messageHandler?.({
      data: Buffer.from(JSON.stringify(event)),
      ack,
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(auditMock.record).toHaveBeenCalledWith(event);
    expect(ack).toHaveBeenCalledTimes(1);

    await service.onModuleDestroy();
  });

  it("closes subscriptions on shutdown", async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(subscriptionMock.close).toHaveBeenCalledTimes(1);
    expect(subscriptionMock.removeAllListeners).toHaveBeenCalledTimes(1);
  });
});
