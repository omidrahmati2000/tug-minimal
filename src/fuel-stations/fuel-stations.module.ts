import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelStationsService } from './fuel-stations.service';
import { FuelStation } from './entities/fuel-station.entity';
import { FuelStationRepository } from './repositories/fuel-station.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FuelStation])],
  providers: [FuelStationsService, FuelStationRepository],
  exports: [FuelStationsService, FuelStationRepository],
})
export class FuelStationsModule {}