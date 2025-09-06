import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateCardDto {
  @ApiProperty({ example: '1234567890123456' })
  @IsNotEmpty()
  @IsString()
  cardNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  holderName: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0)
  dailyLimit: number;

  @ApiProperty({ example: 10000.00 })
  @IsNumber()
  @Min(0)
  monthlyLimit: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  organizationId: number;
}