import { Load } from "./entities/load.entity";
import { LoadsService } from "./loads.service";
import { AuditService } from "../audit/audit.service";
import type { Cache } from "cache-manager";
import type { Repository } from "typeorm";

describe("LoadsService", () => {
  let service: LoadsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    findOneBy: jest.Mock;
  };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
  let audit: { record: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findOneBy: jest.fn(),
    };
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    audit = { record: jest.fn() };

    service = new LoadsService(
      repository as unknown as Repository<Load>,
      cache as unknown as Cache,
      audit as unknown as AuditService,
    );
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
