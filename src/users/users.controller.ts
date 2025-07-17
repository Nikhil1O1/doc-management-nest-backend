import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(page, limit, search, role);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
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
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
} 