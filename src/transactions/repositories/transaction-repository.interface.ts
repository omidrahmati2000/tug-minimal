import { Transaction } from '../entities/transaction.entity';
import { IBaseRepository } from '../../common/repositories/base-repository.interface';

export interface ITransactionRepository extends IBaseRepository<Transaction> {
  findByOrganization(organizationId: number): Promise<Transaction[]>;
  findByCard(cardId: number): Promise<Transaction[]>;
  findByFuelStation(fuelStationId: number): Promise<Transaction[]>;
  findByStatus(status: string): Promise<Transaction[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  findWithRelations(id: number): Promise<Transaction | null>;
  findAllWithRelations(): Promise<Transaction[]>;
  findRecentTransactions(limit?: number): Promise<Transaction[]>;
}