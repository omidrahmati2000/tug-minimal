import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateCardLimitsDto } from './dto/update-card-limits.dto';
import { CardRepository } from './repositories/card.repository';

@Injectable()
export class CardsService {
  constructor(
    private readonly cardRepository: CardRepository,
  ) {}

  async create(createCardDto: CreateCardDto): Promise<Card> {
    const existingCard = await this.cardRepository.findByCardNumber(createCardDto.cardNumber);

    if (existingCard) {
      throw new ConflictException('Card with this number already exists');
    }

    const card = this.cardRepository.create({
      ...createCardDto,
      lastUsageDate: new Date(),
      lastMonthReset: new Date(),
    });

    return await this.cardRepository.save(card);
  }

  async findAll(): Promise<Card[]> {
    return await this.cardRepository.findAllWithRelations();
  }

  async findByOrganization(organizationId: number): Promise<Card[]> {
    return await this.cardRepository.findByOrganization(organizationId);
  }

  async findOne(id: number): Promise<Card> {
    return await this.cardRepository.findByIdOrFail(id);
  }

  async findByCardNumber(cardNumber: string): Promise<Card> {
    const card = await this.cardRepository.findByCardNumber(cardNumber);
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card;
  }

  async update(id: number, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id);
    
    if (updateCardDto.cardNumber && updateCardDto.cardNumber !== card.cardNumber) {
      const existingCard = await this.cardRepository.findByCardNumber(updateCardDto.cardNumber);
      if (existingCard) {
        throw new ConflictException('Card with this number already exists');
      }
    }

    Object.assign(card, updateCardDto);
    return await this.cardRepository.save(card);
  }

  async updateLimits(id: number, updateLimitsDto: UpdateCardLimitsDto): Promise<Card> {
    const card = await this.findOne(id);
    
    if (updateLimitsDto.dailyLimit !== undefined) {
      card.dailyLimit = updateLimitsDto.dailyLimit;
    }
    
    if (updateLimitsDto.monthlyLimit !== undefined) {
      card.monthlyLimit = updateLimitsDto.monthlyLimit;
    }

    return await this.cardRepository.save(card);
  }

  async remove(id: number): Promise<void> {
    await this.cardRepository.deactivateCard(id);
  }

  async checkAccess(cardId: number, organizationId: number): Promise<Card> {
    const card = await this.findOne(cardId);
    
    if (card.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied: Card does not belong to your organization');
    }

    return card;
  }

  async resetDailyUsage(cardId: number): Promise<void> {
    await this.cardRepository.resetDailyUsage(cardId);
  }

  async resetMonthlyUsage(cardId: number): Promise<void> {
    await this.cardRepository.resetMonthlyUsage(cardId);
  }

  async updateUsage(cardId: number, amount: number): Promise<void> {
    await this.cardRepository.updateUsage(cardId, amount);
  }

  async canProcessTransaction(card: Card, amount: number): Promise<{ canProcess: boolean; reason?: string }> {
    const today = new Date().toDateString();
    const cardLastUsage = new Date(card.lastUsageDate).toDateString();
    
    let dailyUsage = card.dailyUsage;
    let monthlyUsage = card.monthlyUsage;

    if (cardLastUsage !== today) {
      dailyUsage = 0;
    }

    const currentMonth = new Date().getMonth();
    const lastResetMonth = new Date(card.lastMonthReset).getMonth();
    
    if (currentMonth !== lastResetMonth) {
      monthlyUsage = 0;
    }

    if (dailyUsage + amount > card.dailyLimit) {
      return { canProcess: false, reason: 'Daily limit exceeded' };
    }

    if (monthlyUsage + amount > card.monthlyLimit) {
      return { canProcess: false, reason: 'Monthly limit exceeded' };
    }

    return { canProcess: true };
  }
}