import { Injectable, NotFoundException } from '@nestjs/common';
import { FuelStation } from './entities/fuel-station.entity';
import { FuelStationRepository } from './repositories/fuel-station.repository';

@Injectable()
export class FuelStationsService {
  constructor(
    private readonly fuelStationRepository: FuelStationRepository,
  ) {}

  async findByApiKey(apiKey: string): Promise<FuelStation> {
    const station = await this.fuelStationRepository.findByApiKey(apiKey);

    if (!station) {
      throw new NotFoundException('Invalid API key or station not found');
    }

    return station;
  }

  async findOne(id: string): Promise<FuelStation> {
    return await this.fuelStationRepository.findByIdOrFail(id);
  }
}