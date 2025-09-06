import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Card } from '../entities/card.entity';
import { ICardRepository } from './card-repository.interface';

@Injectable()
export class CardRepository extends BaseRepository<Card> implements ICardRepository {
  constructor(
    @InjectRepository(Card)
    protected readonly cardRepository: Repository<Card>,
  ) {
    super(cardRepository);
  }

  async findByCardNumber(cardNumber: string): Promise<Card | null> {
    return await this.findOne({
      where: { cardNumber },
      relations: ['organization'],
    });
  }

  async findByOrganization(organizationId: number): Promise<Card[]> {
    return await this.find({
      where: { organizationId, isActive: true },
      relations: ['organization', 'transactions'],
    });
  }

  async findActiveCards(): Promise<Card[]> {
    return await this.find({
      where: { isActive: true },
      relations: ['organization'],
    });
  }

  async findWithRelations(id: number): Promise<Card | null> {
    return await this.findOne({
      where: { id },
      relations: ['organization', 'transactions'],
    });
  }

  async updateUsage(cardId: number, amount: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Card)
      .set({ 
        dailyUsage: () => `dailyUsage + ${amount}`,
        monthlyUsage: () => `monthlyUsage + ${amount}`,
        lastUsageDate: new Date(),
        updatedAt: new Date(),
      })
      .where('id = :cardId', { cardId })
      .execute();
  }

  async resetDailyUsage(cardId: number): Promise<void> {
    await this.repository.update(cardId, {
      dailyUsage: 0,
      lastUsageDate: new Date(),
    });
  }

  async resetMonthlyUsage(cardId: number): Promise<void> {
    await this.repository.update(cardId, {
      monthlyUsage: 0,
      lastMonthReset: new Date(),
    });
  }

  async deactivateCard(id: number): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async findAllWithRelations(): Promise<Card[]> {
    return await this.find({
      relations: ['organization'],
    });
  }

  async findByCardNumberWithLock(cardNumber: string): Promise<Card | null> {
    return await this.repository.findOne({
      where: { cardNumber, isActive: true },
      relations: ['organization'],
      lock: { mode: 'pessimistic_write' },
    });
  }
}