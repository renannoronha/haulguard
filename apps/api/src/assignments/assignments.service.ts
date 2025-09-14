import { ConflictException, Injectable } from "@nestjs/common";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Assignment } from "./entities/assignment.entity";
import { QueryFailedError, Repository } from "typeorm";

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto) {
    try {
      const assignment = this.assignmentsRepository.create(createAssignmentDto);
      const savedAssignment = await this.assignmentsRepository.save(assignment);
      return savedAssignment;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error?.driverError?.code === "23505") {
          throw new ConflictException("driver_already_has_active_assignment");
        }
      }
      throw error;
    }
  }

  findAll() {
    return this.assignmentsRepository.find();
  }

  findOne(driverId: number, loadId: number) {
    return this.assignmentsRepository.findOneBy({ driverId, loadId });
  }

  async update(
    driverId: number,
    loadId: number,
    updateAssignmentDto: UpdateAssignmentDto,
  ) {
    const result = await this.assignmentsRepository.update(
      { driverId, loadId },
      updateAssignmentDto,
    );
    return { affected: result.affected || 0 };
  }
}
