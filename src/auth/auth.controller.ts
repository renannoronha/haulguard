import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Request,
  Get,
  HttpCode,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { AuthDto } from "./dto/auth.dto";
import { SignUpDto } from "./dto/signup.dto";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  signup(@Body() data: SignUpDto) {
    return this.authService.signup(data);
  }

  @HttpCode(200)
  @Public()
  @Post("login")
  login(@Body(ValidationPipe) data: LoginDto) {
    return this.authService.login(data.username, data.password);
  }

  @Get("profile")
  getProfile(@Request() req: { user: LoginDto }): LoginDto {
    return req.user;
  }

  @HttpCode(200)
  @Post("logout")
  logout(@Request() req: { user: AuthDto }) {
    return this.authService.logout(req.user);
  }
}
