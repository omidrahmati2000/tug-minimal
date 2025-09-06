import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FuelStationsService } from '../../fuel-stations/fuel-stations.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private fuelStationsService: FuelStationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const fuelStation = await this.fuelStationsService.findByApiKey(apiKey);
      request.fuelStation = fuelStation;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}