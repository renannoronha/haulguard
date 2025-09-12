import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Driver } from '../../drivers/entities/driver.entity';
import { Load } from '../../loads/entities/load.entity';
import { AssignmentStatus } from '../enums/assignment-status.enum';

@Entity('assignment')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'driver_id' })
  driverId: number;

  @Column({ name: 'load_id' })
  loadId: number;

  @ManyToOne(() => Driver, (driver) => driver.assignments)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @ManyToOne(() => Load, (load) => load.assignments)
  @JoinColumn({ name: 'load_id' })
  load: Load;

  @Column({
    type: 'int',
    enum: AssignmentStatus,
    default: AssignmentStatus.ASSIGNED,
  })
  status: AssignmentStatus;

  @Column({ name: 'assigned_at', type: 'timestamp' })
  assignedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;
}
