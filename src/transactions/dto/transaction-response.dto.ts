import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
import { CardResponseDto } from '../../cards/dto/card-response.dto';
import { OrganizationResponseDto } from '../../organizations/dto/organization-response.dto';
import { FuelStationResponseDto } from '../../fuel-stations/dto/fuel-station-response.dto';

export class TransactionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 100.00 })
  amount: number;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.APPROVED })
  status: TransactionStatus;

  @ApiProperty({ example: 'Insufficient balance', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ example: 1 })
  cardId: number;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ example: 1 })
  fuelStationId: number;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  transactionDate: Date;

  @ApiProperty({ type: CardResponseDto, required: false })
  card?: CardResponseDto;

  @ApiProperty({ type: OrganizationResponseDto, required: false })
  organization?: OrganizationResponseDto;

  @ApiProperty({ type: FuelStationResponseDto, required: false })
  fuelStation?: FuelStationResponseDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class TransactionProcessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1, required: false })
  transactionId?: number;

  @ApiProperty({ example: 'Transaction processed successfully', required: false })
  message?: string;

  @ApiProperty({ example: 'Insufficient balance', required: false })
  rejectionReason?: string;
}