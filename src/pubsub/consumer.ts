import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConsumerModule } from "./consumer.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ConsumerModule);
  const logger = new Logger("ConsumerBootstrap");
  app.enableShutdownHooks();
  logger.log("Consumer application context initialized");
}

void bootstrap();
