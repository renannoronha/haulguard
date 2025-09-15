import { PublisherService } from "./publisher.service";

type PubSubMocks = {
  publishMessageMock: jest.Mock;
  topicMock: jest.Mock;
  PubSubMock: jest.Mock;
};

jest.mock("@google-cloud/pubsub", () => {
  const publishMessageMock = jest.fn();
  const topicMock = jest.fn(() => ({ publishMessage: publishMessageMock }));
  const PubSubMock = jest.fn(() => ({ topic: topicMock }));
  return {
    PubSub: PubSubMock,
    __mocks: { publishMessageMock, topicMock, PubSubMock },
  };
});

const {
  __mocks: { publishMessageMock, topicMock, PubSubMock },
} = jest.requireMock("@google-cloud/pubsub") as {
  __mocks: PubSubMocks;
};

describe("PublisherService", () => {
  let service: PublisherService;

  beforeEach(() => {
    publishMessageMock.mockReset();
    topicMock.mockClear();
    PubSubMock.mockClear();
    service = new PublisherService();
  });

  it("should publish messages with serialized payloads", async () => {
    const payload = { foo: "bar" };
    publishMessageMock.mockResolvedValueOnce("message-123");

    const messageId = await service.publish("test-topic", payload);

    expect(PubSubMock).toHaveBeenCalledWith({ projectId: "fake" });
    expect(topicMock).toHaveBeenCalledWith("test-topic");
    expect(publishMessageMock).toHaveBeenCalledTimes(1);
    const [{ data }] = publishMessageMock.mock.calls[0];
    expect(JSON.parse(data.toString("utf-8"))).toEqual(payload);
    expect(messageId).toBe("message-123");
  });

  it("should publish load assigned events and allow consumers to parse them", async () => {
    const consumer = jest.fn();
    publishMessageMock.mockImplementationOnce(async ({ data }) => {
      consumer(JSON.parse(data.toString("utf-8")));
      return "message-456";
    });

    const payload = { driverId: 9, loadId: 4 };
    const messageId = await service.publishLoadAssigned(payload);

    expect(topicMock).toHaveBeenCalledWith("load.assigned");
    expect(consumer).toHaveBeenCalledWith(payload);
    expect(messageId).toBe("message-456");
  });
});
