import { INestApplication } from "@nestjs/common";
import { Server } from "node:http";
import { Test } from "@nestjs/testing";
import request from "supertest";

jest.mock("cache-manager-redis-yet", () => ({
  redisStore: jest.fn(async () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}));

import { AppModule } from "../src/app.module";
import { AppConfigService } from "../src/config/app-config.service";
import { PublisherService } from "../src/pubsub/publisher.service";
import { AuditService } from "../src/audit/audit.service";
import {
  DataSource,
  type Repository,
  type UpdateResult,
  type DeleteResult,
} from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../src/users/entities/user.entity";
import { Assignment } from "../src/assignments/entities/assignment.entity";
import { Driver } from "../src/drivers/entities/driver.entity";
import { Load } from "../src/loads/entities/load.entity";
import { UserRole } from "../src/users/enums/user-role.enum";
import { AssignmentStatus } from "../src/assignments/enums/assignment-status.enum";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { AuditEventDoc } from "../src/audit/audit.schema";
import * as bcrypt from "bcrypt";

type Criteria<T> = Partial<Record<keyof T, unknown>>;

type UpdateCriteria<T extends { id?: number }> = number | Criteria<T>;

type DeleteCriteria<T extends { id?: number }> = number | Criteria<T>;

class InMemoryRepository<T extends { id?: number }> {
  private items: T[] = [];
  private nextId = 1;

  constructor(initial: T[] = []) {
    this.reset(initial);
  }

  reset(data: T[]): void {
    this.items = data.map((item) => ({ ...item }));
    this.nextId =
      this.items.reduce((acc, item) => Math.max(acc, item.id ?? 0), 0) + 1;
  }

  private matches(entity: T, criteria: Criteria<T>): boolean {
    return Object.entries(criteria).every(([key, value]) => {
      return (entity as Record<string, unknown>)[key] === value;
    });
  }

  private resolveTargets(criteria: UpdateCriteria<T> | DeleteCriteria<T>): T[] {
    if (typeof criteria === "number") {
      return this.items.filter((item) => item.id === criteria);
    }
    return this.items.filter((item) => this.matches(item, criteria));
  }

  create(payload: Partial<T>): T {
    return { ...(payload as T) };
  }

  async save(entity: T): Promise<T> {
    if (!entity.id) {
      entity.id = this.nextId++;
    }
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) {
      this.items[index] = { ...this.items[index], ...entity };
    } else {
      this.items.push({ ...entity });
    }
    const stored = this.items.find((item) => item.id === entity.id);
    return { ...(stored as T) };
  }

  async find(): Promise<T[]> {
    return this.items.map((item) => ({ ...item }));
  }

  async findOneBy(criteria: Criteria<T>): Promise<T | null> {
    const found = this.items.find((item) => this.matches(item, criteria));
    return found ? { ...found } : null;
  }

  async findOne(options: { where: Criteria<T> }): Promise<T | null> {
    return this.findOneBy(options.where ?? {});
  }

  async update(
    criteria: UpdateCriteria<T>,
    partialEntity: Partial<T>,
  ): Promise<UpdateResult> {
    const targets = this.resolveTargets(criteria);
    let affected = 0;
    for (const item of targets) {
      const index = this.items.findIndex((candidate) => candidate.id === item.id);
      if (index >= 0) {
        this.items[index] = { ...this.items[index], ...partialEntity };
        affected += 1;
      }
    }
    return { affected } as UpdateResult;
  }

  async delete(criteria: DeleteCriteria<T>): Promise<DeleteResult> {
    const targets = this.resolveTargets(criteria);
    const ids = new Set(targets.map((item) => item.id));
    const before = this.items.length;
    this.items = this.items.filter((item) => !ids.has(item.id));
    return { affected: before - this.items.length } as DeleteResult;
  }
}

class TestAppConfigService {
  postgres() {
    return {
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "postgres",
      database: "haulguard_test",
    };
  }

  redis() {
    return { host: "localhost", port: 6379, ttlSeconds: 60 };
  }

  mongo() {
    return { uri: "mongodb://localhost:27017", dbName: "haulguard-test" };
  }

  pubsub() {
    return {
      projectId: "test-project",
      topic: "load.assigned",
      subscription: "load.assigned.sub",
      emulatorHost: "localhost:8085",
    };
  }

  jwt() {
    return { secret: "secret" };
  }

  bcrypt() {
    return { rounds: 1, pepper: "pepper" };
  }
}

describe("AppModule integration", () => {
  let app: INestApplication;
  let httpServer: Server;
  let userRepository: InMemoryRepository<User>;
  let assignmentRepository: InMemoryRepository<Assignment>;
  let publisherMock: { publish: jest.Mock; publishLoadAssigned: jest.Mock };
  let auditMock: { record: jest.Mock };
  const configStub = new TestAppConfigService();
  const plainPassword = "Secret#123";
  let hashedPassword: string;

  const seedUser = () => {
    const now = new Date();
    userRepository.reset([
      {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        password: hashedPassword,
        status: true,
        role: UserRole.ADMIN,
        createdAt: now,
        updatedAt: now,
        lastLogin: undefined,
        sessionId: null,
      } as User,
    ]);
  };

  beforeAll(async () => {
    const bcryptConfig = configStub.bcrypt();
    hashedPassword = await bcrypt.hash(
      `${plainPassword}${bcryptConfig.pepper}`,
      bcryptConfig.rounds,
    );

    userRepository = new InMemoryRepository<User>();
    assignmentRepository = new InMemoryRepository<Assignment>();

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    const dataSourceMock = {
      initialize: jest.fn(),
      destroy: jest.fn(),
      getRepository: jest.fn(),
    } as Partial<DataSource>;

    const mongooseConnectionMock = {
      close: jest.fn(),
      asPromise: jest.fn(),
      models: {},
      model: jest.fn(() => ({})),
    };

    publisherMock = {
      publish: jest.fn(),
      publishLoadAssigned: jest.fn(),
    };
    auditMock = {
      record: jest.fn(),
    };

    moduleBuilder.overrideProvider(AppConfigService).useValue(configStub);
    moduleBuilder
      .overrideProvider(DataSource)
      .useValue(dataSourceMock as DataSource);
    moduleBuilder
      .overrideProvider(getConnectionToken())
      .useValue(mongooseConnectionMock);
    moduleBuilder
      .overrideProvider(getModelToken(AuditEventDoc.name))
      .useValue({});
    moduleBuilder.overrideProvider(PublisherService).useValue(publisherMock);
    moduleBuilder.overrideProvider(AuditService).useValue(auditMock);

    moduleBuilder
      .overrideProvider(getRepositoryToken(User))
      .useValue(userRepository as unknown as Repository<User>);
    moduleBuilder
      .overrideProvider(getRepositoryToken(Assignment))
      .useValue(assignmentRepository as unknown as Repository<Assignment>);
    moduleBuilder
      .overrideProvider(getRepositoryToken(Driver))
      .useValue(new InMemoryRepository<Driver>() as unknown as Repository<Driver>);
    moduleBuilder
      .overrideProvider(getRepositoryToken(Load))
      .useValue(new InMemoryRepository<Load>() as unknown as Repository<Load>);

    const moduleFixture = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    seedUser();
    assignmentRepository.reset([]);
  });

  afterAll(async () => {
    await app.close();
  });

  const loginAndGetToken = async () => {
    const response = await request(httpServer)
      .post("/auth/login")
      .set("x-request-id", "login-request")
      .send({ username: "admin@example.com", password: plainPassword })
      .expect(200);

    return response.body.data.access_token as string;
  };

  it("wraps validation errors with the global HttpExceptionFilter", async () => {
    const { body } = await request(httpServer)
      .post("/auth/login")
      .set("x-request-id", "req-400")
      .send({ username: "admin@example.com" })
      .expect(400);

    expect(body.success).toBe(false);
    expect(body.meta).toEqual({ requestId: "req-400" });
    expect(body.error.code).toBe("Bad Request");
    expect(body.error.message).toMatch(
      /password (should not be empty|must be a string)/,
    );
  });

  it("returns a wrapped payload on successful login", async () => {
    const { body } = await request(httpServer)
      .post("/auth/login")
      .set("x-request-id", "req-login")
      .send({ username: "admin@example.com", password: plainPassword })
      .expect(200);

    expect(body.success).toBe(true);
    expect(body.meta).toEqual({ requestId: "req-login" });
    expect(body.data).toEqual({
      access_token: expect.any(String),
    });
  });

  it("protects private routes with the JWT guard", async () => {
    await request(httpServer).get("/auth/profile").expect(401);

    const token = await loginAndGetToken();

    const { body } = await request(httpServer)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .set("x-request-id", "req-profile")
      .expect(200);

    expect(body.success).toBe(true);
    expect(body.meta).toEqual({ requestId: "req-profile" });
    expect(body.data.email).toBe("admin@example.com");
    expect(body.data.sessionId).toBeDefined();
  });

  it("creates assignments and triggers side effects", async () => {
    const token = await loginAndGetToken();

    const { body } = await request(httpServer)
      .post("/assignments")
      .set("Authorization", `Bearer ${token}`)
      .set("x-request-id", "req-assign")
      .send({ driverId: 7, loadId: 3 })
      .expect(201);

    expect(body.success).toBe(true);
    expect(body.meta).toEqual({ requestId: "req-assign" });
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      driverId: 7,
      loadId: 3,
    });
    if ("status" in body.data) {
      expect(body.data.status).toBe(AssignmentStatus.ASSIGNED);
    }
    expect(publisherMock.publishLoadAssigned).toHaveBeenCalledWith({
      driverId: 7,
      loadId: 3,
    });
    expect(auditMock.record).toHaveBeenCalledWith({
      type: "ASSIGNED",
      payload: { driverId: 7, loadId: 3 },
    });
  });
});
