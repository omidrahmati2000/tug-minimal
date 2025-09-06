import { ApiProperty } from '@nestjs/swagger';
import { OrganizationResponseDto } from '../../organizations/dto/organization-response.dto';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';

export class CardResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '1234567890123456' })
  cardNumber: string;

  @ApiProperty({ example: 'John Doe' })
  holderName: string;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 100.00 })
  dailyUsage: number;

  @ApiProperty({ example: 1500.00 })
  monthlyUsage: number;

  @ApiProperty({ example: 500.00 })
  dailyLimit: number;

  @ApiProperty({ example: 5000.00 })
  monthlyLimit: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', nullable: true })
  lastUsageDate: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', nullable: true })
  lastMonthReset: Date | null;

  @ApiProperty({ type: OrganizationResponseDto, required: false })
  organization?: OrganizationResponseDto;

  @ApiProperty({ type: [TransactionResponseDto], required: false })
  transactions?: TransactionResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}