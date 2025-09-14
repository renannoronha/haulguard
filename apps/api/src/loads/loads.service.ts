import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateLoadDto } from "./dto/create-load.dto";
import { UpdateLoadDto } from "./dto/update-load.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Load } from "./entities/load.entity";
import { Repository } from "typeorm";

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private loadsRepository: Repository<Load>,
  ) {}

  async create(createLoadDto: CreateLoadDto) {
    const load = this.loadsRepository.create(createLoadDto);
    const savedLoad = await this.loadsRepository.save(load);
    return { id: savedLoad.id };
  }

  findAll() {
    return this.loadsRepository.find();
  }

  findOne(id: number) {
    return this.loadsRepository.findOneBy({ id });
  }

  async update(id: number, updateLoadDto: UpdateLoadDto) {
    await this.loadsRepository.update(id, updateLoadDto);
    return { message: "updated_load_successfully" };
  }

  async remove(id: number) {
    const result = await this.loadsRepository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException("load_not_found");
    }
    return { message: "deleted_load_successfully" };
  }
}
