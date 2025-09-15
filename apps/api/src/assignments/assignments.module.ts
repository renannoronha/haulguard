import { Module } from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { AssignmentsController } from "./assignments.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Assignment } from "./entities/assignment.entity";
import { PublisherModule } from "src/pubsub/publisher.module";
import { AuditModule } from "src/audit/audit.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    PublisherModule,
    AuditModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
