import { Repository, FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { IBaseRepository } from './base-repository.interface';
import { NotFoundException } from '@nestjs/common';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  create(entity: DeepPartial<T>): T {
    return this.repository.create(entity);
  }

  async save(entity: T): Promise<T> {
    return await this.repository.save(entity);
  }

  async saveMany(entities: T[]): Promise<T[]> {
    return await this.repository.save(entities);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.repository.findOne(options);
  }

  async findOneBy(where: Partial<T>): Promise<T | null> {
    return await this.repository.findOneBy(where as any);
  }

  async findById(id: string | number): Promise<T | null> {
    return await this.repository.findOneBy({ id } as any);
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findBy(where: Partial<T>): Promise<T[]> {
    return await this.repository.findBy(where as any);
  }

  async update(id: string | number, updateData: Partial<T>): Promise<void> {
    await this.repository.update(id, updateData as any);
  }

  async updateMany(where: Partial<T>, updateData: Partial<T>): Promise<void> {
    await this.repository.update(where as any, updateData as any);
  }

  async delete(id: string | number): Promise<void> {
    await this.repository.delete(id);
  }

  async softDelete(id: string | number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return await this.repository.count(options);
  }

  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.repository.countBy(where as any);
    return count > 0;
  }

  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    const entity = await this.findOne(options);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }

  async findByIdOrFail(id: string | number): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}