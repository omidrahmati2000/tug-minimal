import { Card } from '../entities/card.entity';
import { IBaseRepository } from '../../common/repositories/base-repository.interface';

export interface ICardRepository extends IBaseRepository<Card> {
  findByCardNumber(cardNumber: string): Promise<Card | null>;
  findByOrganization(organizationId: number): Promise<Card[]>;
  findActiveCards(): Promise<Card[]>;
  findWithRelations(id: number): Promise<Card | null>;
  updateUsage(cardId: number, amount: number): Promise<void>;
  resetDailyUsage(cardId: number): Promise<void>;
  resetMonthlyUsage(cardId: number): Promise<void>;
  deactivateCard(id: number): Promise<void>;
}