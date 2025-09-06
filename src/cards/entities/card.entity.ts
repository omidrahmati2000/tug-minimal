import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cardNumber: string;

  @Column()
  holderName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  dailyLimit: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monthlyLimit: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  dailyUsage: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  monthlyUsage: number;

  @Column({ type: 'date', nullable: true })
  lastUsageDate: Date;

  @Column({ type: 'date', nullable: true })
  lastMonthReset: Date;

  @Column()
  organizationId: number;

  @ManyToOne(() => Organization, (organization) => organization.cards)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => Transaction, (transaction) => transaction.card)
  transactions: Transaction[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}