import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  correlationId?: string;
  userId?: number;
  userEmail?: string;
  organizationId?: number;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
}

@Injectable({ scope: Scope.DEFAULT })
export class AppLoggerService implements LoggerService {
  private static asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  static runWithContext<T>(context: LogContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  static getContext(): LogContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  static setCorrelationId(correlationId?: string): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store.correlationId = correlationId || uuidv4();
    }
  }

  static getCorrelationId(): string | undefined {
    const store = this.asyncLocalStorage.getStore();
    return store?.correlationId;
  }

  private formatMessage(message: string, context?: string): any {
    const logContext = AppLoggerService.getContext() || {};
    
    return {
      message,
      context,
      ...logContext,
    };
  }

  log(message: string, context?: string): void {
    this.logger.info(this.formatMessage(message, context));
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(this.formatMessage(message, context), { trace });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(this.formatMessage(message, context));
  }

  debug(message: string, context?: string): void {
    this.logger.debug(this.formatMessage(message, context));
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(this.formatMessage(message, context));
  }

  // Business logic logging methods
  logUserAction(action: string, userId: number, details?: any): void {
    this.logger.info({
      message: `User action: ${action}`,
      context: 'UserAction',
      userId,
      action,
      details,
      ...AppLoggerService.getContext(),
    });
  }

  logBusinessEvent(event: string, entityId: number, entityType: string, details?: any): void {
    this.logger.info({
      message: `Business event: ${event}`,
      context: 'BusinessEvent',
      event,
      entityId,
      entityType,
      details,
      ...AppLoggerService.getContext(),
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any): void {
    this.logger.warn({
      message: `Security event: ${event}`,
      context: 'SecurityEvent',
      event,
      severity,
      details,
      ...AppLoggerService.getContext(),
    });
  }

  logPerformanceMetric(operation: string, duration: number, details?: any): void {
    this.logger.info({
      message: `Performance metric: ${operation}`,
      context: 'Performance',
      operation,
      duration,
      details,
      ...AppLoggerService.getContext(),
    });
  }

  logDatabaseOperation(query: string, duration: number, rowsAffected?: number): void {
    this.logger.debug({
      message: 'Database operation',
      context: 'Database',
      query: query.replace(/\s+/g, ' ').trim(),
      duration,
      rowsAffected,
      ...AppLoggerService.getContext(),
    });
  }

  logApiCall(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.logger[level]({
      message: `API call: ${method} ${url}`,
      context: 'ApiCall',
      method,
      url,
      statusCode,
      responseTime,
      userAgent,
      ...AppLoggerService.getContext(),
    });
  }
}