import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";
import { LoadsService } from "./loads.service";

describe("LoadsService", () => {
  let service: LoadsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadsService,
        {
          provide: getRepositoryToken(Load),
          useValue: repository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get<LoadsService>(LoadsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should fetch from the repository and cache results on cache miss", async () => {
    const loads = [{ id: 1 } as Load];
    cache.get.mockResolvedValueOnce(undefined);
    repository.find.mockResolvedValueOnce(loads);

    const result = await service.findAll();

    expect(cache.get).toHaveBeenCalledWith("loads:all");
    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledWith("loads:all", loads, 60);
    expect(result).toEqual(loads);
  });

  it("should return cached loads on cache hit", async () => {
    const cachedLoads = [{ id: 2 } as Load];
    cache.get.mockResolvedValueOnce(cachedLoads);

    const result = await service.findAll();

    expect(result).toEqual(cachedLoads);
    expect(repository.find).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("should invalidate cached loads when updating", async () => {
    repository.update.mockResolvedValueOnce(undefined);
    cache.del.mockResolvedValueOnce(undefined);
    const updateDto = { status: "UPDATED" } as unknown as Parameters<
      LoadsService["update"]
    >[1];

    const result = await service.update(5, updateDto);

    expect(repository.update).toHaveBeenCalledWith(5, updateDto);
    expect(cache.del).toHaveBeenCalledWith("loads:all");
    expect(result).toEqual({ message: "updated_load_successfully" });
  });
});
