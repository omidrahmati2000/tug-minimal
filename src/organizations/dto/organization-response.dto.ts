import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { CardResponseDto } from '../../cards/dto/card-response.dto';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';

export class OrganizationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Acme Corporation' })
  name: string;

  @ApiProperty({ example: 'ACME001' })
  code: string;

  @ApiProperty({ example: 50000.00 })
  balance: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [UserResponseDto], required: false })
  users?: UserResponseDto[];

  @ApiProperty({ type: [CardResponseDto], required: false })
  cards?: CardResponseDto[];

  @ApiProperty({ type: [TransactionResponseDto], required: false })
  transactions?: TransactionResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}