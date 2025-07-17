import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@ApiTags('Authentication (Demo)')
@Controller('auth')
export class AuthDemoController {
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (Demo)' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered (Demo)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    // Demo implementation without database
    return {
      message: 'User registered successfully (Demo Mode)',
      user: {
        id: 'demo-uuid-' + Date.now(),
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'viewer',
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (Demo)' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully logged in (Demo)',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
        token_type: { type: 'string' },
        expires_in: { type: 'string' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    // Demo implementation without database
    const demoUsers = {
      'admin@example.com': { firstName: 'Admin', lastName: 'User', role: 'admin' },
      'editor@example.com': { firstName: 'Editor', lastName: 'User', role: 'editor' },
      'viewer@example.com': { firstName: 'Viewer', lastName: 'User', role: 'viewer' },
    };

    const user = demoUsers[loginDto.email as keyof typeof demoUsers] || {
      firstName: 'Demo',
      lastName: 'User',
      role: 'viewer',
    };

    return {
      message: 'Login successful (Demo Mode)',
      user: {
        id: 'demo-uuid-' + Date.now(),
        email: loginDto.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      access_token: 'demo-jwt-token-' + Date.now(),
      token_type: 'bearer',
      expires_in: '1d',
    };
  }

  @Get('profile')
  @Public()
  @ApiOperation({ summary: 'Get current user profile (Demo)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully (Demo)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  getProfile() {
    // Demo implementation - return a demo user profile
    // In a real app, this would extract user info from JWT token
    return {
      id: 'demo-uuid-' + Date.now(),
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'viewer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'User logout (Demo)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully logged out (Demo)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  logout() {
    return {
      message: 'Successfully logged out (Demo Mode)',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('demo-info')
  @Public()
  @ApiOperation({ summary: 'Demo information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Demo mode information',
  })
  getDemoInfo() {
    return {
      message: 'Document Management System - Demo Mode',
      features: [
        'User Registration (Demo)',
        'User Login (Demo)', 
        'User Logout (Demo)',
        'User Profile (Demo)',
        'Swagger API Documentation',
        'Health Check Endpoints',
        'React Frontend Integration',
      ],
      demoUsers: [
        { email: 'admin@example.com', password: 'password123', role: 'admin' },
        { email: 'editor@example.com', password: 'password123', role: 'editor' },
        { email: 'viewer@example.com', password: 'password123', role: 'viewer' },
      ],
      note: 'This is a demo version running without database. Use any password with the demo emails above.',
      fullDocumentation: 'http://localhost:3000/api/docs',
    };
  }
} 