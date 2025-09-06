import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { OrganizationRepository } from './repositories/organization.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const existingOrg = await this.organizationRepository.findByCode(createOrganizationDto.code);

    if (existingOrg) {
      throw new ConflictException('Organization with this code already exists');
    }

    const organization = this.organizationRepository.create({
      ...createOrganizationDto,
      balance: createOrganizationDto.balance || 0,
    });

    return await this.organizationRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return await this.organizationRepository.findAllWithRelations();
  }

  async findOne(id: number): Promise<Organization> {
    return await this.organizationRepository.findByIdOrFail(id);
  }

  async findByCode(code: string): Promise<Organization> {
    return await this.organizationRepository.findByCode(code);
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    if (updateOrganizationDto.code && updateOrganizationDto.code !== organization.code) {
      const existingOrg = await this.findByCode(updateOrganizationDto.code);
      if (existingOrg) {
        throw new ConflictException('Organization with this code already exists');
      }
    }

    Object.assign(organization, updateOrganizationDto);
    return await this.organizationRepository.save(organization);
  }

  async updateBalance(id: number, updateBalanceDto: UpdateBalanceDto): Promise<Organization> {
    await this.organizationRepository.updateBalance(id, updateBalanceDto.balance);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.organizationRepository.deactivateOrganization(id);
  }

  async deductBalance(organizationId: number, amount: number): Promise<void> {
    await this.organizationRepository.deductBalance(organizationId, amount);
  }
}