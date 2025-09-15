import "dotenv/config";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT
    ? Number(process.env.POSTGRES_PORT)
    : undefined,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  // ATENÇÃO: para gerar migrações aponte p/ .ts; para rodar em prod (build) use .js
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false, // SEMPRE false quando usando migrações
});
