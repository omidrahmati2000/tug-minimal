import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';

export class FuelStationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Shell Station Downtown' })
  name: string;

  @ApiProperty({ example: 'Downtown, Main Street 123' })
  location: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [TransactionResponseDto], required: false })
  transactions?: TransactionResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}