import { User } from '../entities/user.entity';
import { IBaseRepository } from '../../common/repositories/base-repository.interface';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByOrganization(organizationId: number): Promise<User[]>;
  findActiveUsers(): Promise<User[]>;
  findByRole(role: string): Promise<User[]>;
  deactivateUser(id: number): Promise<void>;
}