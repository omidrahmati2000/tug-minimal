import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsDateString, Length } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: '1234567890123456' })
  @IsNotEmpty()
  @IsString()
  @Length(13, 19, { message: 'Card number must be between 13 and 19 characters' })
  cardNumber: string;

  @ApiProperty({ example: 50.75 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  transactionDate: string;
}