import { FuelStation } from '../entities/fuel-station.entity';
import { IBaseRepository } from '../../common/repositories/base-repository.interface';

export interface IFuelStationRepository extends IBaseRepository<FuelStation> {
  findByApiKey(apiKey: string): Promise<FuelStation | null>;
  findActiveStations(): Promise<FuelStation[]>;
  findWithTransactions(id: number): Promise<FuelStation | null>;
  deactivateStation(id: number): Promise<void>;
}