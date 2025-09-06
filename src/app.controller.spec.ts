import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = appController.getHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return current timestamp in ISO format', () => {
      const beforeCall = new Date();
      const result = appController.getHealth();
      const afterCall = new Date();

      const timestamp = new Date(result.timestamp);
      
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return consistent structure', () => {
      const result = appController.getHealth();

      expect(Object.keys(result)).toEqual(['status', 'timestamp']);
      expect(result.status).toBe('healthy');
    });
  });

  describe('getRoot', () => {
    it('should return API information', () => {
      const result = appController.getRoot();

      expect(result).toEqual({
        message: 'MyFuel API is running',
        version: '1.0.0',
        docs: '/api',
      });
    });

    it('should return consistent API information structure', () => {
      const result = appController.getRoot();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('docs');
      expect(typeof result.message).toBe('string');
      expect(typeof result.version).toBe('string');
      expect(typeof result.docs).toBe('string');
    });

    it('should return correct version and docs path', () => {
      const result = appController.getRoot();

      expect(result.version).toBe('1.0.0');
      expect(result.docs).toBe('/api');
      expect(result.message).toContain('MyFuel API');
    });

    it('should always return the same result', () => {
      const result1 = appController.getRoot();
      const result2 = appController.getRoot();

      expect(result1).toEqual(result2);
    });
  });
});