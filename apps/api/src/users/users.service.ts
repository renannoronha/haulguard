import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { PasswordService } from "libs/security/password.service";
import { UpdatePasswordDto } from "./dto/update-password.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private password: PasswordService,
  ) {}

  findAll() {
    return this.usersRepository.find();
  }

  async create(createUserDto: CreateUserDto) {
    createUserDto.password = await this.password.hash(createUserDto.password);
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const result = await this.usersRepository.update(id, updateUserDto);
    return { message: "updated_user_successfully", affected: result.affected };
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto) {
    // Check if new password is different than old password
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException("user_not_found");
    }

    if (
      await this.password.verify(user.password, updatePasswordDto.newPassword)
    ) {
      throw new BadRequestException("password_must_differ");
    }

    // Hash new password and update user
    const hashedPassword = await this.password.hash(
      updatePasswordDto.newPassword,
    );
    const result = await this.usersRepository.update(id, {
      password: hashedPassword,
    });
    return {
      message: "updated_password_successfully",
      affected: result.affected,
    };
  }

  async remove(id: number) {
    const result = await this.usersRepository.delete(id);
    return {
      message: "deleted_user_successfully",
      affected: result.affected,
    };
  }

  async validateSession(userId: number, jti: string): Promise<boolean> {
    const user = await this.usersRepository.findOneBy({
      id: userId,
      sessionId: jti,
    });
    return !!user;
  }
}
