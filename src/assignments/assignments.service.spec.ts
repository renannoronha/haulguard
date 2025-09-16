import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { QueryFailedError } from "typeorm";
import { Assignment } from "./entities/assignment.entity";
import { AssignmentsService } from "./assignments.service";

jest.mock(
  "src/pubsub/publisher.service",
  () => ({
    PublisherService: class PublisherService {},
  }),
  { virtual: true },
);

jest.mock(
  "src/audit/audit.service",
  () => ({
    AuditService: class AuditService {},
  }),
  { virtual: true },
);

const PublisherServiceToken = jest.requireMock("src/pubsub/publisher.service")
  .PublisherService as new (...args: unknown[]) => unknown;
const AuditServiceToken = jest.requireMock("src/audit/audit.service")
  .AuditService as new (...args: unknown[]) => unknown;

describe("AssignmentsService", () => {
  let service: AssignmentsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let publisher: { publishMessage: jest.Mock };
  let audit: { record: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn(),
    };
    publisher = { publishMessage: jest.fn() };
    audit = { record: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(Assignment),
          useValue: repository,
        },
        { provide: PublisherServiceToken, useValue: publisher },
        { provide: AuditServiceToken, useValue: audit },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should throw a conflict when creating a second active assignment for the same driver", async () => {
    const dto = { driverId: 42, loadId: 7 };
    const savedAssignment = { id: 1, ...dto };
    repository.save
      .mockResolvedValueOnce(savedAssignment)
      .mockRejectedValueOnce(
        new QueryFailedError("INSERT", [], {
          code: "23505",
          constraint: "idx_unique_active_assignment_driver",
        }),
      );

    await expect(service.create(dto)).resolves.toEqual(savedAssignment);
    expect(publisher.publishMessage).toHaveBeenCalledWith({
      type: "ASSIGNMENT_CREATED",
      payload: savedAssignment,
    });

    const secondAttempt = service.create(dto);
    await expect(secondAttempt).rejects.toThrow(ConflictException);
    await expect(secondAttempt).rejects.toThrow(
      "driver_already_has_active_assignment",
    );
    expect(publisher.publishMessage).toHaveBeenCalledTimes(1);
  });
});
