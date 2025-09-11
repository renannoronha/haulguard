import { Module } from '@nestjs/common';
import { LoadsService } from './loads.service';
import { LoadsController } from './loads.controller';

@Module({
  controllers: [LoadsController],
  providers: [LoadsService],
})
export class LoadsModule {}
