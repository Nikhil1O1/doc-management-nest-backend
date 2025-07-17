import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer';
}

interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  isActive?: boolean;
}

@ApiTags('Users (Demo)')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersDemoController {
  private demoUsers = [
    {
      id: 'demo-user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: 'demo-user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      role: 'editor',
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      id: 'demo-user-3',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@example.com',
      role: 'viewer',
      isActive: false,
      lastLoginAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
  ];

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new user (Demo - Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created (Demo)' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createUserDto: CreateUserDto) {
    const newUser = {
      id: 'demo-user-' + Date.now(),
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      role: createUserDto.role || 'viewer',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };

    this.demoUsers.push(newUser);

    return {
      message: 'User created successfully (Demo Mode)',
      user: newUser,
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users with pagination (Demo - Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'editor', 'viewer'] })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully (Demo)' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    let filteredUsers = [...this.demoUsers];

    // Apply role filter
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      limit,
      message: 'Users retrieved successfully (Demo Mode)',
    };
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get user statistics (Demo - Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully (Demo)',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        active: { type: 'number' },
        inactive: { type: 'number' },
        byRole: {
          type: 'object',
          properties: {
            admin: { type: 'number' },
            editor: { type: 'number' },
            viewer: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getStats() {
    const total = this.demoUsers.length;
    const active = this.demoUsers.filter(user => user.isActive).length;
    const inactive = total - active;

    const adminCount = this.demoUsers.filter(user => user.role === 'admin').length;
    const editorCount = this.demoUsers.filter(user => user.role === 'editor').length;
    const viewerCount = this.demoUsers.filter(user => user.role === 'viewer').length;

    return {
      total,
      active,
      inactive,
      byRole: {
        admin: adminCount,
        editor: editorCount,
        viewer: viewerCount,
      },
      message: 'User statistics retrieved successfully (Demo Mode)',
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get user by ID (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findOne(@Param('id') id: string) {
    const user = this.demoUsers.find(u => u.id === id);
    
    if (!user) {
      return {
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    return {
      user,
      message: 'User retrieved successfully (Demo Mode)',
    };
  }

  @Patch(':id')
  @Public()
  @ApiOperation({ summary: 'Update user (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'User updated successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const userIndex = this.demoUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    // Update user
    this.demoUsers[userIndex] = {
      ...this.demoUsers[userIndex],
      ...updateUserDto,
    };

    return {
      user: this.demoUsers[userIndex],
      message: 'User updated successfully (Demo Mode)',
    };
  }

  @Patch(':id/role')
  @Public()
  @ApiOperation({ summary: 'Update user role (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'User role updated successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  updateRole(@Param('id') id: string, @Body('role') role: 'admin' | 'editor' | 'viewer') {
    const userIndex = this.demoUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    this.demoUsers[userIndex].role = role;

    return {
      user: this.demoUsers[userIndex],
      message: 'User role updated successfully (Demo Mode)',
    };
  }

  @Patch(':id/deactivate')
  @Public()
  @ApiOperation({ summary: 'Deactivate user (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  deactivate(@Param('id') id: string) {
    const userIndex = this.demoUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    this.demoUsers[userIndex].isActive = false;

    return {
      user: this.demoUsers[userIndex],
      message: 'User deactivated successfully (Demo Mode)',
    };
  }

  @Patch(':id/activate')
  @Public()
  @ApiOperation({ summary: 'Activate user (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'User activated successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  activate(@Param('id') id: string) {
    const userIndex = this.demoUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    this.demoUsers[userIndex].isActive = true;

    return {
      user: this.demoUsers[userIndex],
      message: 'User activated successfully (Demo Mode)',
    };
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete user (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'User deleted successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id') id: string) {
    const userIndex = this.demoUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    const deletedUser = this.demoUsers.splice(userIndex, 1)[0];

    return {
      user: deletedUser,
      message: 'User deleted successfully (Demo Mode)',
    };
  }
} 