import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DriversModule } from "./drivers/drivers.module";
import { LoadsModule } from "./loads/loads.module";
import { AssignmentsModule } from "./assignments/assignments.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { envValidate } from "src/config/env.validation";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/auth.guard";
import { ResponseInterceptor } from "./common/http/response.interceptor";
import { HttpExceptionFilter } from "./common/http/http-exception.filter";
import { AuditModule } from "./audit/audit.module";
import { PublisherModule } from "./pubsub/publisher.module";
import { AppConfigModule } from "./config/app-config.module";
import { AppConfigService } from "./config/app-config.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidate,
    }),
    AppConfigModule,
    AuthModule,
    UsersModule,
    DriversModule,
    LoadsModule,
    AssignmentsModule,
    AuditModule,
    PublisherModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const db = config.postgres();
        return {
          type: "postgres" as const,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          autoLoadEntities: true,
          synchronize: false,
          migrations: ["dist/migrations/*.js"],
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
