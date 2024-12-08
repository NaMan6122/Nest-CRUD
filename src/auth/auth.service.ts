import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto;

    if (!email || !password || !name) {
      return { success: false, message: 'Please provide all the required fields' };
    }

    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return { success: false, message: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    return { success: true, message: 'User registered successfully!', user };
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
        return { success: false, message: 'Invalid credentials' };
      }

      const payload = { email: user.email, sub: user.id };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login successful',
        token: token,  // You can return the token here for use in controller
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

