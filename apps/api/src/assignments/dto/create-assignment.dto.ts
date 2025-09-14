import { IsEnum, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { AssignmentStatus } from "../enums/assignment-status.enum";

export class CreateAssignmentDto {
  @IsInt()
  @IsNotEmpty()
  driverId: number;

  @IsInt()
  @IsNotEmpty()
  loadId: number;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;
}
