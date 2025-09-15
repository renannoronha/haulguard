import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type PostgresConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export type RedisConfig = {
  host: string;
  port: number;
  ttlSeconds: number;
};

export type MongoConfig = {
  uri: string;
  dbName: string;
};

export type PubSubConfig = {
  projectId: string;
  topic: string;
  subscription: string;
  emulatorHost?: string;
};

export type JwtConfig = {
  secret: string;
};

export type BcryptConfig = {
  rounds: number;
  pepper: string;
};

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  private getNumber(key: string): number {
    const value = this.config.get<unknown>(key, { infer: true });
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid numeric value for ${key}`);
    }
    return parsed;
  }

  postgres(): PostgresConfig {
    return {
      host: this.config.getOrThrow<string>("POSTGRES_HOST", { infer: true }),
      port: this.getNumber("POSTGRES_PORT"),
      database: this.config.getOrThrow<string>("POSTGRES_DB", { infer: true }),
      username: this.config.getOrThrow<string>("POSTGRES_USER", {
        infer: true,
      }),
      password: this.config.getOrThrow<string>("POSTGRES_PASSWORD", {
        infer: true,
      }),
    } satisfies PostgresConfig;
  }

  redis(): RedisConfig {
    return {
      host: this.config.getOrThrow<string>("REDIS_HOST", { infer: true }),
      port: this.getNumber("REDIS_PORT"),
      ttlSeconds: 60,
    } satisfies RedisConfig;
  }

  mongo(): MongoConfig {
    return {
      uri: this.config.getOrThrow<string>("MONGO_URI", { infer: true }),
      dbName: this.config.getOrThrow<string>("MONGO_DB", { infer: true }),
    } satisfies MongoConfig;
  }

  pubsub(): PubSubConfig {
    const emulatorHost =
      this.config.get<string>("PUBSUB_EMULATOR_HOST", {
        infer: true,
      }) ?? undefined;
    return {
      projectId: this.config.getOrThrow<string>("PUBSUB_PROJECT_ID", {
        infer: true,
      }),
      topic: this.config.getOrThrow<string>("PUBSUB_LOAD_ASSIGNED_TOPIC", {
        infer: true,
      }),
      subscription: this.config.getOrThrow<string>(
        "PUBSUB_LOAD_ASSIGNED_SUBSCRIPTION",
        { infer: true },
      ),
      emulatorHost,
    } satisfies PubSubConfig;
  }

  jwt(): JwtConfig {
    return {
      secret: this.config.getOrThrow<string>("JWT_SECRET", { infer: true }),
    } satisfies JwtConfig;
  }

  bcrypt(): BcryptConfig {
    return {
      rounds: this.getNumber("BCRYPT_ROUNDS"),
      pepper: this.config.getOrThrow<string>("BCRYPT_PEPPER", { infer: true }),
    } satisfies BcryptConfig;
  }
}
