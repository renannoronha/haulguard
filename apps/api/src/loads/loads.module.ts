import { Module } from "@nestjs/common";
import { LoadsService } from "./loads.service";
import { LoadsController } from "./loads.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Load])],
  controllers: [LoadsController],
  providers: [LoadsService],
})
export class LoadsModule {}
