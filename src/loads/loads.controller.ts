import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  Patch,
  ParseIntPipe,
} from "@nestjs/common";
import { LoadsService } from "./loads.service";
import { CreateLoadDto } from "./dto/create-load.dto";
import { UpdateLoadDto } from "./dto/update-load.dto";

@Controller("loads")
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  create(@Body(ValidationPipe) createLoadDto: CreateLoadDto) {
    return this.loadsService.create(createLoadDto);
  }

  @Get()
  findAll() {
    return this.loadsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.loadsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body(ValidationPipe) updateLoadDto: UpdateLoadDto,
  ) {
    return this.loadsService.update(id, updateLoadDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.loadsService.remove(id);
  }
}
