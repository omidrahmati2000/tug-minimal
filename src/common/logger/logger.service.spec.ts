import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppLoggerService, LogContext } from './logger.service';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let mockWinstonLogger: any;

  beforeEach(async () => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
      ],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('static context methods', () => {
    it('should run with context', () => {
      const context: LogContext = { correlationId: 'test-id', userId: 1 };
      const callback = jest.fn(() => 'result');

      const result = AppLoggerService.runWithContext(context, callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should get context', () => {
      const context: LogContext = { correlationId: 'test-id', userId: 1 };
      
      AppLoggerService.runWithContext(context, () => {
        const retrievedContext = AppLoggerService.getContext();
        expect(retrievedContext).toEqual(context);
      });
    });

    it('should return undefined when no context set', () => {
      const context = AppLoggerService.getContext();
      expect(context).toBeUndefined();
    });

    it('should set correlation ID', () => {
      const context: LogContext = {};
      
      AppLoggerService.runWithContext(context, () => {
        AppLoggerService.setCorrelationId('custom-id');
        expect(context.correlationId).toBe('custom-id');
      });
    });

    it('should generate correlation ID if not provided', () => {
      (uuidv4 as jest.Mock).mockReturnValue('generated-uuid');
      const context: LogContext = {};
      
      AppLoggerService.runWithContext(context, () => {
        AppLoggerService.setCorrelationId();
        expect(context.correlationId).toBe('generated-uuid');
      });
    });

    it('should get correlation ID', () => {
      const context: LogContext = { correlationId: 'test-correlation-id' };
      
      AppLoggerService.runWithContext(context, () => {
        const correlationId = AppLoggerService.getCorrelationId();
        expect(correlationId).toBe('test-correlation-id');
      });
    });

    it('should return undefined correlation ID when no context', () => {
      const correlationId = AppLoggerService.getCorrelationId();
      expect(correlationId).toBeUndefined();
    });
  });

  describe('basic logging methods', () => {
    it('should log info message', () => {
      service.log('test message', 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith({
        message: 'test message',
        context: 'TestContext',
      });
    });

    it('should log error message with trace', () => {
      service.error('error message', 'error trace', 'ErrorContext');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        {
          message: 'error message',
          context: 'ErrorContext',
        },
        { trace: 'error trace' }
      );
    });

    it('should log warning message', () => {
      service.warn('warning message', 'WarnContext');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith({
        message: 'warning message',
        context: 'WarnContext',
      });
    });

    it('should log debug message', () => {
      service.debug('debug message', 'DebugContext');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith({
        message: 'debug message',
        context: 'DebugContext',
      });
    });

    it('should log verbose message', () => {
      service.verbose('verbose message', 'VerboseContext');

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith({
        message: 'verbose message',
        context: 'VerboseContext',
      });
    });

    it('should include context in log messages', () => {
      const logContext: LogContext = { 
        correlationId: 'test-id', 
        userId: 1, 
        organizationId: 2 
      };

      AppLoggerService.runWithContext(logContext, () => {
        service.log('test message', 'TestContext');

        expect(mockWinstonLogger.info).toHaveBeenCalledWith({
          message: 'test message',
          context: 'TestContext',
          correlationId: 'test-id',
          userId: 1,
          organizationId: 2,
        });
      });
    });
  });

  describe('business logic logging methods', () => {
    it('should log user action', () => {
      const context: LogContext = { correlationId: 'test-id' };
      
      AppLoggerService.runWithContext(context, () => {
        service.logUserAction('login', 1, { ip: '127.0.0.1' });

        expect(mockWinstonLogger.info).toHaveBeenCalledWith({
          message: 'User action: login',
          context: 'UserAction',
          userId: 1,
          action: 'login',
          details: { ip: '127.0.0.1' },
          correlationId: 'test-id',
        });
      });
    });

    it('should log business event', () => {
      const context: LogContext = { correlationId: 'test-id' };
      
      AppLoggerService.runWithContext(context, () => {
        service.logBusinessEvent('transaction_created', 123, 'Transaction', { amount: 100 });

        expect(mockWinstonLogger.info).toHaveBeenCalledWith({
          message: 'Business event: transaction_created',
          context: 'BusinessEvent',
          event: 'transaction_created',
          entityId: 123,
          entityType: 'Transaction',
          details: { amount: 100 },
          correlationId: 'test-id',
        });
      });
    });

    it('should log security event', () => {
      const context: LogContext = { correlationId: 'test-id' };
      
      AppLoggerService.runWithContext(context, () => {
        service.logSecurityEvent('failed_login', 'medium', { attempts: 3 });

        expect(mockWinstonLogger.warn).toHaveBeenCalledWith({
          message: 'Security event: failed_login',
          context: 'SecurityEvent',
          event: 'failed_login',
          severity: 'medium',
          details: { attempts: 3 },
          correlationId: 'test-id',
        });
      });
    });

    it('should log performance metric', () => {
      const context: LogContext = { correlationId: 'test-id' };
      
      AppLoggerService.runWithContext(context, () => {
        service.logPerformanceMetric('database_query', 150, { query: 'SELECT * FROM users' });

        expect(mockWinstonLogger.info).toHaveBeenCalledWith({
          message: 'Performance metric: database_query',
          context: 'Performance',
          operation: 'database_query',
          duration: 150,
          details: { query: 'SELECT * FROM users' },
          correlationId: 'test-id',
        });
      });
    });

    it('should log database operation', () => {
      const context: LogContext = { correlationId: 'test-id' };
      
      AppLoggerService.runWithContext(context, () => {
        service.logDatabaseOperation('SELECT * FROM users   WHERE id = 1', 50, 1);

        expect(mockWinstonLogger.debug).toHaveBeenCalledWith({
          message: 'Database operation',
          context: 'Database',
          query: 'SELECT * FROM users WHERE id = 1',
          duration: 50,
          rowsAffected: 1,
          correlationId: 'test-id',
        });
      });
    });

    describe('logApiCall', () => {
      const context: LogContext = { correlationId: 'test-id' };

      it('should log successful API call as info', () => {
        AppLoggerService.runWithContext(context, () => {
          service.logApiCall('GET', '/api/users', 200, 150, 'Mozilla/5.0');

          expect(mockWinstonLogger.info).toHaveBeenCalledWith({
            message: 'API call: GET /api/users',
            context: 'ApiCall',
            method: 'GET',
            url: '/api/users',
            statusCode: 200,
            responseTime: 150,
            userAgent: 'Mozilla/5.0',
            correlationId: 'test-id',
          });
        });
      });

      it('should log client error API call as warn', () => {
        AppLoggerService.runWithContext(context, () => {
          service.logApiCall('POST', '/api/users', 400, 50);

          expect(mockWinstonLogger.warn).toHaveBeenCalledWith({
            message: 'API call: POST /api/users',
            context: 'ApiCall',
            method: 'POST',
            url: '/api/users',
            statusCode: 400,
            responseTime: 50,
            userAgent: undefined,
            correlationId: 'test-id',
          });
        });
      });

      it('should log server error API call as error', () => {
        AppLoggerService.runWithContext(context, () => {
          service.logApiCall('GET', '/api/users', 500, 1000);

          expect(mockWinstonLogger.error).toHaveBeenCalledWith({
            message: 'API call: GET /api/users',
            context: 'ApiCall',
            method: 'GET',
            url: '/api/users',
            statusCode: 500,
            responseTime: 1000,
            userAgent: undefined,
            correlationId: 'test-id',
          });
        });
      });
    });
  });
});