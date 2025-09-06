import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateBalanceDto {
  @ApiProperty({ example: 5000.00, description: 'New balance amount' })
  @IsNumber()
  @Min(0)
  balance: number;
}