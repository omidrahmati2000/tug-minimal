import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppLoggerService, LogContext } from '../logger/logger.service';
import { getLoggerConfig } from '../logger/logger.config';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  private readonly loggerConfig = getLoggerConfig();

  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get or generate correlation ID
    const correlationId = (request.headers['x-correlation-id'] as string) || uuidv4();
    
    // Set response header
    response.setHeader('X-Correlation-ID', correlationId);

    // Extract user info from request (if authenticated)
    const user = (request as any).user;

    // Create log context
    const logContext: LogContext = {
      correlationId,
      userId: user?.id,
      userEmail: user?.email,
      organizationId: user?.organizationId,
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      method: request.method,
      url: request.url,
    };

    // Run the request within the async local storage context
    return new Observable(observer => {
      AppLoggerService.runWithContext(logContext, () => {
        const startTime = Date.now();

        next.handle().pipe(
          tap({
            next: (data) => {
              const responseTime = Date.now() - startTime;
              const statusCode = response.statusCode;

              // Log API call if enabled
              if (this.loggerConfig.enableHttpLogs) {
                // Only log non-health endpoints or errors
                if (!request.url.includes('/health') || statusCode >= 400) {
                  this.logger.logApiCall(
                    request.method,
                    request.url,
                    statusCode,
                    responseTime,
                    request.headers['user-agent']
                  );
                }
              }

              // Set response time in context
              logContext.responseTime = responseTime;
              logContext.statusCode = statusCode;

              observer.next(data);
              observer.complete();
            },
            error: (error) => {
              const responseTime = Date.now() - startTime;
              const statusCode = response.statusCode || 500;

              // Always log errors
              this.logger.logApiCall(
                request.method,
                request.url,
                statusCode,
                responseTime,
                request.headers['user-agent']
              );

              // Set error context
              logContext.responseTime = responseTime;
              logContext.statusCode = statusCode;

              observer.error(error);
            }
          })
        ).subscribe({
          next: (data) => observer.next(data),
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });
      });
    });
  }
}