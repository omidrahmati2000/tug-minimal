import { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';

export interface IBaseRepository<T> {
  create(entity: DeepPartial<T>): T;
  save(entity: T): Promise<T>;
  saveMany(entities: T[]): Promise<T[]>;
  findOne(options: FindOneOptions<T>): Promise<T | null>;
  findOneBy(where: Partial<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  find(options?: FindManyOptions<T>): Promise<T[]>;
  findBy(where: Partial<T>): Promise<T[]>;
  update(id: string, updateData: Partial<T>): Promise<void>;
  updateMany(where: Partial<T>, updateData: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  count(options?: FindManyOptions<T>): Promise<number>;
  exists(where: Partial<T>): Promise<boolean>;
}