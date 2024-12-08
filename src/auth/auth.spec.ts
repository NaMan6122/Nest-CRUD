import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, JwtService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signup', () => {
    it('should throw error if user already exists', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.signup(signupDto)).rejects.toThrowError('User already exists');
    });

    it('should create a user successfully if not exists', async () => {
      const signupDto: SignupDto = {
        email: 'newuser@example.com',
        password: 'newpassword',
        name: 'New User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce({
        id: '2',
        email: 'newuser@example.com',
        password: 'hashedpassword',
        name: 'New User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup(signupDto);

      expect(result.message).toBe('User registered successfully!');
      expect(result.user).toHaveProperty('email', 'newuser@example.com');
    });
  });

  describe('login', () => {
    it('should throw an error if user is not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrowError('Invalid credentials');
    });

    it('should throw an error if password does not match', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword', // Note: This should be a hash of the correct password
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrowError('Invalid credentials');
    });

    it('should return a success message and set a cookie if login is successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'correctpassword',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword', // Assume it's hashed
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const jwtToken = 'mocked-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(jwtToken);

      const response = await service.login(loginDto);
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Login successful');
      expect(response.token).toBe(jwtToken);
    });
  });

});