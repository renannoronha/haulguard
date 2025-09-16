import { Test, TestingModule } from "@nestjs/testing";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

describe("AuditController", () => {
  let controller: AuditController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it("should return audit events from the service", async () => {
    const events = [{ type: "ASSIGNED", payload: {} }];
    service.findAll.mockResolvedValue(events);

    await expect(controller.findAll()).resolves.toBe(events);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });
});
