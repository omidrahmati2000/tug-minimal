import { Organization } from '../entities/organization.entity';
import { IBaseRepository } from '../../common/repositories/base-repository.interface';

export interface IOrganizationRepository extends IBaseRepository<Organization> {
  findByCode(code: string): Promise<Organization | null>;
  findWithRelations(id: number): Promise<Organization | null>;
  findActiveOrganizations(): Promise<Organization[]>;
  deductBalance(organizationId: number, amount: number): Promise<void>;
  updateBalance(id: number, balance: number): Promise<void>;
  deactivateOrganization(id: number): Promise<void>;
}