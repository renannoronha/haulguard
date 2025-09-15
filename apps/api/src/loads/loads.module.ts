import { Module } from "@nestjs/common";
import { CacheModule, type CacheModuleOptions } from "@nestjs/cache-manager";
import { LoadsService } from "./loads.service";
import { LoadsController } from "./loads.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";
import { ConfigModule } from "@nestjs/config";

// Use a dynamic Redis store when env is present

// @ts-expect-error: optional peer until deps are installed
import { redisStore } from "cache-manager-redis-yet";

@Module({
  imports: [
    TypeOrmModule.forFeature([Load]),
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: false,
      inject: [],
      useFactory: async (): Promise<CacheModuleOptions> => {
        const host = process.env.REDIS_HOST ?? "localhost";
        const port = parseInt(process.env.REDIS_PORT ?? "6379", 10);
        // Fallback to in-memory if redis store is unavailable at build-time
        try {
          if (host) {
            return {
              // 60 seconds default TTL
              ttl: 60,
              store: await redisStore({
                socket: { host, port },
              }),
            } satisfies CacheModuleOptions;
          }
        } catch {
          // ignore and fall through to default memory store
        }
        return { ttl: 60 } satisfies CacheModuleOptions;
      },
    }),
  ],
  controllers: [LoadsController],
  providers: [LoadsService],
})
export class LoadsModule {}
