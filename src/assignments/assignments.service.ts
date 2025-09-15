import { ConflictException, Injectable } from "@nestjs/common";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Assignment } from "./entities/assignment.entity";
import { QueryFailedError, Repository } from "typeorm";
import { PublisherService } from "src/pubsub/publisher.service";
import { AuditService } from "src/audit/audit.service";
import { UpdateAssignmentStatusDto } from "./dto/update-assignment-status.dto";

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    private readonly publisher: PublisherService,
    private readonly audit: AuditService,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto) {
    try {
      const assignment = this.assignmentsRepository.create(createAssignmentDto);
      const savedAssignment = await this.assignmentsRepository.save(assignment);
      // publish event to Pub/Sub emulator
      void this.publisher.publishLoadAssigned({
        driverId: savedAssignment.driverId,
        loadId: savedAssignment.loadId,
      });
      // record audit event in MongoDB
      await this.audit.record({
        type: "ASSIGNED",
        payload: {
          driverId: savedAssignment.driverId,
          loadId: savedAssignment.loadId,
        },
      });
      return savedAssignment;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverErr = (error as { driverError?: unknown }).driverError;
        const code =
          driverErr && typeof driverErr === "object" && "code" in driverErr
            ? (driverErr as { code?: unknown }).code
            : undefined;

        if (code === "23505") {
          const constraint =
            driverErr &&
            typeof driverErr === "object" &&
            "constraint" in driverErr
              ? (driverErr as { constraint?: unknown }).constraint
              : undefined;

          if (typeof constraint === "string") {
            if (constraint.includes("load")) {
              throw new ConflictException("load_already_has_active_assignment");
            }
            if (constraint.includes("driver")) {
              throw new ConflictException(
                "driver_already_has_active_assignment",
              );
            }
          }
          throw new ConflictException("assignment_conflict");
        }
      }
      throw error;
    }
  }

  findAll() {
    return this.assignmentsRepository.find();
  }

  findOne(id: number) {
    return this.assignmentsRepository.findOneBy({ id });
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    const result = await this.assignmentsRepository.update(
      { id },
      updateAssignmentDto,
    );
    return { affected: result.affected || 0 };
  }

  async updateStatus(
    id: number,
    updateAssignmentDto: UpdateAssignmentStatusDto,
  ) {
    const result = await this.assignmentsRepository.update(
      { id },
      { status: updateAssignmentDto.status },
    );
    await this.audit.record({
      type: updateAssignmentDto.status,
      payload: { assignmentId: id },
    });
    return { affected: result.affected || 0 };
  }
}
