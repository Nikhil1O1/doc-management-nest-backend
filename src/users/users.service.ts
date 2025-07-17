import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: UserRole,
  ): Promise<{ users: Partial<User>[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const where: FindOptionsWhere<User> = {};
    
    if (search) {
      where.firstName = ILike(`%${search}%`);
      // You might want to use OR conditions here for a more comprehensive search
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'password',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'password',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { isActive: true } });
    const inactive = total - active;

    const adminCount = await this.userRepository.count({ where: { role: UserRole.ADMIN } });
    const editorCount = await this.userRepository.count({ where: { role: UserRole.EDITOR } });
    const viewerCount = await this.userRepository.count({ where: { role: UserRole.VIEWER } });

    return {
      total,
      active,
      inactive,
      byRole: {
        [UserRole.ADMIN]: adminCount,
        [UserRole.EDITOR]: editorCount,
        [UserRole.VIEWER]: viewerCount,
      },
    };
  }
} 