import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { LoadStatus } from '../enums/load-status.enum';

@Entity('load')
export class Load {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  origin: string;

  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ type: 'varchar', length: 100, name: 'cargo_type' })
  cargoType: string;

  @Column({ type: 'int', enum: LoadStatus, default: LoadStatus.PENDING })
  status: LoadStatus;

  @OneToMany(() => Assignment, (assignment) => assignment.load)
  assignments: Assignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;
}
