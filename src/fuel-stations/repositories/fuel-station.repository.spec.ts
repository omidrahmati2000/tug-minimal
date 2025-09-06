import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelStationRepository } from './fuel-station.repository';
import { FuelStation } from '../entities/fuel-station.entity';

describe('FuelStationRepository', () => {
  let repository: FuelStationRepository;
  let mockRepository: Partial<Repository<FuelStation>>;

  const mockFuelStation = {
    id: 1,
    name: 'Test Station',
    apiKey: 'test-api-key-123',
    location: 'Test Location',
    isActive: true,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuelStationRepository,
        {
          provide: getRepositoryToken(FuelStation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<FuelStationRepository>(FuelStationRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByApiKey', () => {
    it('should find active fuel station by API key', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockFuelStation);

      const result = await repository.findByApiKey('test-api-key-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { apiKey: 'test-api-key-123', isActive: true },
      });
      expect(result).toEqual(mockFuelStation);
    });

    it('should return null if station not found or inactive', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByApiKey('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('findActiveStations', () => {
    it('should find only active fuel stations', async () => {
      const activeStations = [mockFuelStation];
      mockRepository.find = jest.fn().mockResolvedValue(activeStations);

      const result = await repository.findActiveStations();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toEqual(activeStations);
    });
  });

  describe('findWithTransactions', () => {
    it('should find fuel station by id with transactions relation', async () => {
      const stationWithTransactions = {
        ...mockFuelStation,
        transactions: [{ id: 1, amount: 100 }],
      };
      mockRepository.findOne = jest.fn().mockResolvedValue(stationWithTransactions);

      const result = await repository.findWithTransactions(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
      expect(result).toEqual(stationWithTransactions);
    });

    it('should return null if station not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findWithTransactions(999);

      expect(result).toBeNull();
    });
  });

  describe('deactivateStation', () => {
    it('should deactivate fuel station by setting isActive to false', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.deactivateStation(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { isActive: false });
    });
  });
});