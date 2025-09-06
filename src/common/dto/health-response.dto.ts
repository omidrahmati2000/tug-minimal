import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'healthy' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

export class ApiInfoResponseDto {
  @ApiProperty({ example: 'MyFuel API is running' })
  message: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: '/api' })
  docs: string;
}