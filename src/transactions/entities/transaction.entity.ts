import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
import { Card } from '../../cards/entities/card.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { FuelStation } from '../../fuel-stations/entities/fuel-station.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column()
  cardId: number;

  @ManyToOne(() => Card, (card) => card.transactions)
  @JoinColumn({ name: 'cardId' })
  card: Card;

  @Column()
  organizationId: number;

  @ManyToOne(() => Organization, (organization) => organization.transactions)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  fuelStationId: number;

  @ManyToOne(() => FuelStation, (fuelStation) => fuelStation.transactions)
  @JoinColumn({ name: 'fuelStationId' })
  fuelStation: FuelStation;

  @Column({ type: 'timestamp' })
  transactionDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}