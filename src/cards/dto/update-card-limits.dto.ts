import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateCardLimitsDto {
  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 10000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyLimit?: number;
}