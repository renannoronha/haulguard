import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "../enums/user-role.enum";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true })
  updatedAt?: Date;

  @Column({ type: "boolean", default: true })
  status: boolean;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  role: UserRole;

  @Column({ name: "last_login", type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ name: "session_id", type: "text", nullable: true })
  sessionId?: string | null;
}
