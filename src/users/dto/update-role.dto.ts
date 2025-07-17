import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'New user role',
    enum: UserRole,
    example: UserRole.EDITOR,
  })
  @IsEnum(UserRole, { message: 'Role must be admin, editor, or viewer' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;
} 