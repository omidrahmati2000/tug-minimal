import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Card } from '../cards/entities/card.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionListener } from './listeners/transaction.listener';
import { FuelStationsModule } from '../fuel-stations/fuel-stations.module';
import { CardsModule } from '../cards/cards.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Card, Organization]),
    FuelStationsModule,
    CardsModule,
    OrganizationsModule,
    CommonModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository, TransactionListener],
  exports: [TransactionsService, TransactionRepository],
})
export class TransactionsModule {}