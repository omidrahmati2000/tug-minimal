import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Transaction } from '../entities/transaction.entity';
import { ITransactionRepository } from './transaction-repository.interface';

@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> implements ITransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    protected readonly transactionRepository: Repository<Transaction>,
  ) {
    super(transactionRepository);
  }

  async findByOrganization(organizationId: number): Promise<Transaction[]> {
    return await this.find({
      where: { organizationId },
      relations: ['card', 'organization', 'fuelStation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCard(cardId: number): Promise<Transaction[]> {
    return await this.find({
      where: { cardId },
      relations: ['card', 'organization', 'fuelStation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByFuelStation(fuelStationId: number): Promise<Transaction[]> {
    return await this.find({
      where: { fuelStationId },
      relations: ['card', 'organization', 'fuelStation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Transaction[]> {
    return await this.find({
      where: { status: status as any },
      relations: ['card', 'organization', 'fuelStation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.card', 'card')
      .leftJoinAndSelect('transaction.organization', 'organization')
      .leftJoinAndSelect('transaction.fuelStation', 'fuelStation')
      .where('transaction.createdAt >= :startDate', { startDate })
      .andWhere('transaction.createdAt <= :endDate', { endDate })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();
  }

  async findWithRelations(id: number): Promise<Transaction | null> {
    return await this.findOne({
      where: { id },
      relations: ['card', 'organization', 'fuelStation'],
    });
  }

  async findAllWithRelations(): Promise<Transaction[]> {
    return await this.find({
      relations: ['card', 'organization', 'fuelStation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return await this.find({
      relations: ['card', 'organization', 'fuelStation'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}