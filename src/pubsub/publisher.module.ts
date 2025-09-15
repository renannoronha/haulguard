import { Module } from "@nestjs/common";
import { PublisherService } from "./publisher.service";
import { AppConfigModule } from "src/config/app-config.module";

@Module({
  imports: [AppConfigModule],
  providers: [PublisherService],
  exports: [PublisherService],
})
export class PublisherModule {}
