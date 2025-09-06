import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ACME001' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 10000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}