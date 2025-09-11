import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { LoadsModule } from './loads/loads.module';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [AuthModule, UsersModule, DriversModule, LoadsModule, AssignmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
