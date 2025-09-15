import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
  ParseIntPipe,
} from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";

@Controller("assignments")
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  create(@Body(ValidationPipe) createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsService.create(createAssignmentDto);
  }

  @Get()
  findAll() {
    return this.assignmentsService.findAll();
  }

  @Get(":driverId/:loadId")
  findOne(
    @Param("driverId", ParseIntPipe) driverId: number,
    @Param("loadId", ParseIntPipe) loadId: number,
  ) {
    return this.assignmentsService.findOne(driverId, loadId);
  }

  @Patch(":driverId/:loadId")
  update(
    @Param("driverId", ParseIntPipe) driverId: number,
    @Param("loadId", ParseIntPipe) loadId: number,
    @Body(ValidationPipe) updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(
      driverId,
      loadId,
      updateAssignmentDto,
    );
  }
}
