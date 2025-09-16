import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateLoadDto } from "./dto/create-load.dto";
import { UpdateLoadDto } from "./dto/update-load.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PublisherService } from "src/pubsub/publisher.service";

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private loadsRepository: Repository<Load>,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly publisher: PublisherService,
  ) {}

  async create(createLoadDto: CreateLoadDto) {
    const load = this.loadsRepository.create(createLoadDto);
    const savedLoad = await this.loadsRepository.save(load);
    // Invalidate cached loads list
    await this.cache.del("loads:all");
    await this.publisher.publishMessage({
      type: "LOAD_CREATED",
      payload: savedLoad,
    });
    return { id: savedLoad.id };
  }

  async findAll(): Promise<Load[]> {
    const key = "loads:all";
    const cached = await this.cache.get<Load[]>(key);
    if (cached) return cached;
    const list = await this.loadsRepository.find();
    // 60 seconds TTL
    await this.cache.set(key, list, 60);
    return list;
  }

  findOne(id: number) {
    return this.loadsRepository.findOneBy({ id });
  }

  async update(id: number, updateLoadDto: UpdateLoadDto) {
    await this.loadsRepository.update(id, updateLoadDto);
    // Invalidate cached loads list
    await this.cache.del("loads:all");
    await this.publisher.publishMessage({
      type: "LOAD_UPDATED",
      payload: { id, changes: updateLoadDto },
    });
    return { message: "updated_load_successfully" };
  }

  async remove(id: number) {
    const result = await this.loadsRepository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException("load_not_found");
    }
    // Invalidate cached loads list
    await this.cache.del("loads:all");
    await this.publisher.publishMessage({
      type: "LOAD_DELETED",
      payload: { id },
    });
    return { message: "deleted_load_successfully" };
  }
}
