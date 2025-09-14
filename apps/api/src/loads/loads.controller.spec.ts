import { Test, TestingModule } from "@nestjs/testing";
import { LoadsController } from "./loads.controller";
import { LoadsService } from "./loads.service";

describe("LoadsController", () => {
  let controller: LoadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoadsController],
      providers: [LoadsService],
    }).compile();

    controller = module.get<LoadsController>(LoadsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
