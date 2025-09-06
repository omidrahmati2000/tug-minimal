import { Test, TestingModule } from '@nestjs/testing';
import { FuelStationsService } from './fuel-stations.service';
import { FuelStationRepository } from './repositories/fuel-station.repository';
import { FuelStation } from './entities/fuel-station.entity';
import { NotFoundException } from '@nestjs/common';

describe('FuelStationsService', () => {
  let service: FuelStationsService;
  let fuelStationRepository: FuelStationRepository;

  const mockFuelStation: FuelStation = {
    id: 1,
    name: 'Test Fuel Station',
    location: 'Test Location',
    apiKey: 'test-api-key-123',
    isActive: true,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuelStationsService,
        {
          provide: FuelStationRepository,
          useValue: {
            findByIdOrFail: jest.fn(),
            findByApiKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FuelStationsService>(FuelStationsService);
    fuelStationRepository = module.get<FuelStationRepository>(FuelStationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a fuel station by ID', async () => {
      jest.spyOn(fuelStationRepository, 'findByIdOrFail').mockResolvedValue(mockFuelStation);

      const result = await service.findOne('1');

      expect(result).toEqual(mockFuelStation);
    });

    it('should throw NotFoundException if fuel station not found', async () => {
      jest.spyOn(fuelStationRepository, 'findByIdOrFail').mockRejectedValue(new NotFoundException());

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByApiKey', () => {
    it('should return fuel station for valid API key', async () => {
      jest.spyOn(fuelStationRepository, 'findByApiKey').mockResolvedValue(mockFuelStation);

      const result = await service.findByApiKey('test-api-key-123');

      expect(result).toEqual(mockFuelStation);
    });

    it('should throw NotFoundException for invalid API key', async () => {
      jest.spyOn(fuelStationRepository, 'findByApiKey').mockResolvedValue(null);

      await expect(service.findByApiKey('invalid-key')).rejects.toThrow(NotFoundException);
    });
  });
});