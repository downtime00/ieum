import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.save(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { status: UserStatus.ACTIVE },
      relations: ['profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, status: UserStatus.ACTIVE },
      relations: ['profile', 'socialAccounts'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return this.userRepository.save({ ...existing, ...updateUserDto });
  }

  async remove(id: number): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    await this.userRepository.update(id, { status: UserStatus.DELETED });
  }

  async searchByName(name: string): Promise<User[]> {
    return this.userRepository.find({
      where: { name: Like(`%${name}%`), status: UserStatus.ACTIVE },
      relations: ['profile'],
    });
  }
}