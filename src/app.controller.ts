import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponseDto, ApiInfoResponseDto } from './common/dto/health-response.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API information', type: ApiInfoResponseDto })
  getRoot(): ApiInfoResponseDto {
    return {
      message: 'MyFuel API is running',
      version: '1.0.0',
      docs: '/api',
    };
  }
}