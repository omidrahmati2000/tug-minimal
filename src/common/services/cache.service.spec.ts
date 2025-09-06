import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

// Mock Redis before importing
const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incrby: jest.fn(),
  expire: jest.fn(),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should get and parse JSON value', async () => {
      const testData = { id: 1, name: 'test' };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get<typeof testData>('test-key');

      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null if key does not exist', async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null and log error on JSON parse error', async () => {
      mockRedisInstance.get.mockResolvedValue('invalid-json');
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await service.get('invalid-key');

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should return null and log error on Redis error', async () => {
      mockRedisInstance.get.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await service.get('error-key');

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith('Error getting key error-key:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      const testData = { id: 1, name: 'test' };
      mockRedisInstance.set.mockResolvedValue('OK');

      await service.set('test-key', testData);

      expect(mockRedisInstance.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
    });

    it('should set value with TTL', async () => {
      const testData = { id: 1, name: 'test' };
      mockRedisInstance.setex.mockResolvedValue('OK');

      await service.set('test-key', testData, 300);

      expect(mockRedisInstance.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testData));
    });

    it('should log error on Redis error', async () => {
      mockRedisInstance.set.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await service.set('error-key', 'value');

      expect(loggerSpy).toHaveBeenCalledWith('Error setting key error-key:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
    });

    it('should log error on Redis error', async () => {
      mockRedisInstance.del.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await service.del('error-key');

      expect(loggerSpy).toHaveBeenCalledWith('Error deleting key error-key:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(mockRedisInstance.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      mockRedisInstance.exists.mockResolvedValue(0);

      const result = await service.exists('nonexistent-key');

      expect(result).toBe(false);
    });

    it('should return false and log error on Redis error', async () => {
      mockRedisInstance.exists.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await service.exists('error-key');

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith('Error checking existence of key error-key:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('setWithExpiry', () => {
    it('should call set with TTL', async () => {
      const setSpy = jest.spyOn(service, 'set');
      mockRedisInstance.setex.mockResolvedValue('OK');

      await service.setWithExpiry('test-key', 'value', 300);

      expect(setSpy).toHaveBeenCalledWith('test-key', 'value', 300);
    });
  });

  describe('increment', () => {
    it('should increment key by default value', async () => {
      mockRedisInstance.incrby.mockResolvedValue(2);

      const result = await service.increment('counter-key');

      expect(mockRedisInstance.incrby).toHaveBeenCalledWith('counter-key', 1);
      expect(result).toBe(2);
    });

    it('should increment key by custom value', async () => {
      mockRedisInstance.incrby.mockResolvedValue(10);

      const result = await service.increment('counter-key', 5);

      expect(mockRedisInstance.incrby).toHaveBeenCalledWith('counter-key', 5);
      expect(result).toBe(10);
    });

    it('should throw error on Redis error', async () => {
      mockRedisInstance.incrby.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(service.increment('error-key')).rejects.toThrow('Redis error');
      expect(loggerSpy).toHaveBeenCalledWith('Error incrementing key error-key:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('expire', () => {
    it('should set expiry for key', async () => {
      mockRedisInstance.expire.mockResolvedValue(1);

      await service.expire('test-key', 300);

      expect(mockRedisInstance.expire).toHaveBeenCalledWith('test-key', 300);
    });

    it('should log error on Redis error', async () => {
      mockRedisInstance.expire.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await service.expire('error-key', 300);

      expect(loggerSpy).toHaveBeenCalledWith('Error setting expiry for key error-key:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('key generation methods', () => {
    it('should generate key from parts', () => {
      const result = service.generateKey('part1', 'part2', 'part3');
      expect(result).toBe('part1:part2:part3');
    });

    it('should generate user cache key', () => {
      const result = service.getUserCacheKey('123');
      expect(result).toBe('user:123');
    });

    it('should generate organization cache key', () => {
      const result = service.getOrganizationCacheKey('456');
      expect(result).toBe('organization:456');
    });

    it('should generate card cache key', () => {
      const result = service.getCardCacheKey('789');
      expect(result).toBe('card:789');
    });

    it('should generate transaction lock key', () => {
      const result = service.getTransactionLockKey('org123');
      expect(result).toBe('transaction_lock:org123');
    });
  });
});