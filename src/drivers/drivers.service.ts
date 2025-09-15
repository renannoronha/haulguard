import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Driver } from "./entities/driver.entity";
import { QueryFailedError, Repository } from "typeorm";

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    try {
      const driver = this.driversRepository.create(createDriverDto);
      const savedDriver = await this.driversRepository.save(driver);
      return { id: savedDriver.id };
    } catch (error) {
      // Handle errors, e.g., duplicate license number
      if (error instanceof QueryFailedError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error?.driverError?.code === "23505") {
          throw new ConflictException("driver_already_exists");
        }
      }
      throw error;
    }
  }

  findAll() {
    return this.driversRepository.find();
  }

  findOne(id: number) {
    return this.driversRepository.findOneBy({ id });
  }

  async update(id: number, updateDriverDto: UpdateDriverDto) {
    await this.driversRepository.update(id, updateDriverDto);
    return { message: "updated_driver_successfully" };
  }

  async remove(id: number) {
    const result = await this.driversRepository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException("driver_not_found");
    }
    return { message: "deleted_driver_successfully" };
  }
}
