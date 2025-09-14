import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { Assignment } from "../../assignments/entities/assignment.entity";

@Entity("driver")
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 50, name: "license_number", unique: true })
  licenseNumber: string;

  @Column({ type: "boolean", default: true })
  status: boolean;

  @OneToMany(() => Assignment, (assignment) => assignment.driver)
  assignments: Assignment[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true, select: false })
  deletedAt?: Date;
}
