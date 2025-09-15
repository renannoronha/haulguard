import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { AuthDto } from "./dto/auth.dto";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { QueryFailedError } from "typeorm";
import { randomUUID } from "crypto";
import { PasswordService } from "libs/security/password.service";
import { SignUpDto } from "./dto/signup.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private password: PasswordService,
  ) {}

  async signup(data: SignUpDto): Promise<any> {
    const user = new CreateUserDto();
    user.email = data.email;
    user.password = await this.password.hash(data.password);
    user.name = data.name;
    try {
      await this.usersService.create(user);
      return { message: "signup_success" };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error?.driverError?.code === "23505") {
          throw new ConflictException("signup_failed_user_registered");
        }
      }
      throw error; // repropaga outros erros
    }
  }

  async login(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);

    if (!user) {
      throw new UnauthorizedException("login_failed_user_not_found");
    }

    if (!user.status) {
      throw new UnauthorizedException("login_failed_user_inactive");
    }

    const isMatch = await this.password.verify(user.password, password);
    if (!isMatch) {
      throw new UnauthorizedException("login_failed_wrong_password");
    }

    const jti = randomUUID();

    const payload: AuthDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId: jti,
    };
    const access_token = await this.jwtService.signAsync(payload);

    await this.usersService.update(user.id, {
      lastLogin: new Date(),
      sessionId: jti,
    });
    return { access_token: access_token };
  }

  async logout(user: AuthDto): Promise<any> {
    await this.usersService.update(user.id, {
      sessionId: null,
    });

    return { message: "logout_success" };
  }
}
