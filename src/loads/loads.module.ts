import { Module } from "@nestjs/common";
import { CacheModule, type CacheModuleOptions } from "@nestjs/cache-manager";
import { LoadsService } from "./loads.service";
import { LoadsController } from "./loads.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";
import { redisStore } from "cache-manager-redis-yet";
import { AuditModule } from "../audit/audit.module";
import { AppConfigModule } from "src/config/app-config.module";
import { AppConfigService } from "src/config/app-config.service";
import { PublisherModule } from "src/pubsub/publisher.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Load]),
    AuditModule,
    PublisherModule,
    CacheModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: async (
        config: AppConfigService,
      ): Promise<CacheModuleOptions> => {
        const redis = config.redis();
        // Fallback to in-memory if redis store is unavailable at build-time
        try {
          return {
            ttl: redis.ttlSeconds,
            store: await redisStore({
              socket: { host: redis.host, port: redis.port },
            }),
          } satisfies CacheModuleOptions;
        } catch {
          // ignore and fall through to default memory store
        }
        return { ttl: redis.ttlSeconds } satisfies CacheModuleOptions;
      },
    }),
  ],
  controllers: [LoadsController],
  providers: [LoadsService],
})
export class LoadsModule {}
