import { IsEnum } from "class-validator";
import { AssignmentStatus } from "../enums/assignment-status.enum";

export class UpdateAssignmentStatusDto {
  @IsEnum(AssignmentStatus, {
    message: `status must be one of: ${AssignmentStatus.COMPLETED}, ${AssignmentStatus.CANCELLED}`,
  })
  status: AssignmentStatus.COMPLETED | AssignmentStatus.CANCELLED;
}
