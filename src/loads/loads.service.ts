import { Injectable } from '@nestjs/common';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';

@Injectable()
export class LoadsService {
  create(createLoadDto: CreateLoadDto) {
    return 'This action adds a new load';
  }

  findAll() {
    return `This action returns all loads`;
  }

  findOne(id: number) {
    return `This action returns a #${id} load`;
  }

  update(id: number, updateLoadDto: UpdateLoadDto) {
    return `This action updates a #${id} load`;
  }

  remove(id: number) {
    return `This action removes a #${id} load`;
  }
}
