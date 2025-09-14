import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
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
    @Param("driverId") driverId: string,
    @Param("loadId") loadId: string,
  ) {
    return this.assignmentsService.findOne(+driverId, +loadId);
  }

  @Patch(":driverId/:loadId")
  update(
    @Param("driverId") driverId: string,
    @Param("loadId") loadId: string,
    @Body(ValidationPipe) updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(
      +driverId,
      +loadId,
      updateAssignmentDto,
    );
  }
}
