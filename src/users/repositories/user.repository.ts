import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { User } from '../entities/user.entity';
import { IUserRepository } from './user-repository.interface';

@Injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(
    @InjectRepository(User)
    protected readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findByOrganization(organizationId: number): Promise<User[]> {
    return await this.find({
      where: { organizationId },
      relations: ['organization'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.find({
      where: { isActive: true },
      relations: ['organization'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findByRole(role: string): Promise<User[]> {
    return await this.find({
      where: { role: role as any },
      relations: ['organization'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async deactivateUser(id: number): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async findByIdWithRelations(id: number): Promise<User | null> {
    return await this.findOne({
      where: { id },
      relations: ['organization'],
    });
  }
}