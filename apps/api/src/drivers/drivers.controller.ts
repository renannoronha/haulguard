import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  Patch,
} from "@nestjs/common";
import { DriversService } from "./drivers.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";

@Controller("drivers")
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  create(@Body(ValidationPipe) createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  findAll() {
    return this.driversService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.driversService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(ValidationPipe) updateDriverDto: UpdateDriverDto,
  ) {
    return this.driversService.update(+id, updateDriverDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.driversService.remove(+id);
  }
}
