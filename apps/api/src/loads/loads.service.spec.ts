import { Test, TestingModule } from "@nestjs/testing";
import { LoadsService } from "./loads.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { AuditService } from "../audit/audit.service";

describe("LoadsService", () => {
  let service: LoadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadsService,
        {
          provide: getRepositoryToken(Load),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { record: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LoadsService>(LoadsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
