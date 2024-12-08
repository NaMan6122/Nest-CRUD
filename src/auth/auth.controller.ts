import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    try {
      const response = await this.authService.signup(signupDto);
      return res.status(201).json({ message: response.message, user: response.user });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
        const response = await this.authService.login(loginDto);
        return res.status(201).json(response);
    } catch (error : any) {
        return res.status(400).json({ message: error.message });
    }
  }
}
