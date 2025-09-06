import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Organization } from '../entities/organization.entity';
import { IOrganizationRepository } from './organization-repository.interface';

@Injectable()
export class OrganizationRepository extends BaseRepository<Organization> implements IOrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    protected readonly organizationRepository: Repository<Organization>,
  ) {
    super(organizationRepository);
  }

  async findByCode(code: string): Promise<Organization | null> {
    return await this.findOne({
      where: { code },
      relations: ['users', 'cards'],
    });
  }

  async findWithRelations(id: number): Promise<Organization | null> {
    return await this.findOne({
      where: { id },
      relations: ['users', 'cards', 'transactions'],
    });
  }

  async findActiveOrganizations(): Promise<Organization[]> {
    return await this.find({
      where: { isActive: true },
      relations: ['users', 'cards'],
    });
  }

  async deductBalance(organizationId: number, amount: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Organization)
      .set({ 
        balance: () => `balance - ${amount}`,
        updatedAt: new Date(),
      })
      .where('id = :organizationId', { organizationId })
      .execute();
  }

  async updateBalance(id: number, balance: number): Promise<void> {
    await this.update(id, { 
      balance,
      updatedAt: new Date(),
    });
  }

  async deactivateOrganization(id: number): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async findAllWithRelations(): Promise<Organization[]> {
    return await this.find({
      relations: ['users', 'cards'],
    });
  }
}