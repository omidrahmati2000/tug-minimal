import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { FuelStation } from '../entities/fuel-station.entity';
import { IFuelStationRepository } from './fuel-station-repository.interface';

@Injectable()
export class FuelStationRepository extends BaseRepository<FuelStation> implements IFuelStationRepository {
  constructor(
    @InjectRepository(FuelStation)
    protected readonly fuelStationRepository: Repository<FuelStation>,
  ) {
    super(fuelStationRepository);
  }

  async findByApiKey(apiKey: string): Promise<FuelStation | null> {
    return await this.findOne({
      where: { apiKey, isActive: true },
    });
  }

  async findActiveStations(): Promise<FuelStation[]> {
    return await this.find({
      where: { isActive: true },
    });
  }

  async findWithTransactions(id: number): Promise<FuelStation | null> {
    return await this.findOne({
      where: { id },
      relations: ['transactions'],
    });
  }

  async deactivateStation(id: number): Promise<void> {
    await this.update(id, { isActive: false });
  }
}