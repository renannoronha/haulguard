import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  Index,
  PrimaryColumn,
} from "typeorm";
import { Driver } from "../../drivers/entities/driver.entity";
import { Load } from "../../loads/entities/load.entity";
import { AssignmentStatus } from "../enums/assignment-status.enum";

@Entity("assignment")
@Index("idx_unique_active_assignment", ["driverId", "status"], {
  unique: true,
  where: `status = '${AssignmentStatus.ASSIGNED}'`,
})
@Index("idx_unique_active_load_assignment", ["loadId", "status"], {
  unique: true,
  where: `status = '${AssignmentStatus.ASSIGNED}'`,
})
export class Assignment {
  @PrimaryColumn({ name: "driver_id", type: "int" })
  driverId: number;

  @PrimaryColumn({ name: "load_id", type: "int" })
  loadId: number;

  @ManyToOne(() => Driver, (driver) => driver.assignments)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @ManyToOne(() => Load, (load) => load.assignments)
  @JoinColumn({ name: "load_id" })
  load: Load;

  @Column({
    type: "enum",
    enum: AssignmentStatus,
    enumName: "assignment_status",
    default: AssignmentStatus.ASSIGNED,
  })
  status: AssignmentStatus;

  @Column({
    name: "assigned_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  assignedAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true })
  updatedAt?: Date;
}
