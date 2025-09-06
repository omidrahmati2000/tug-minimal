import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/logger.service';
import { QueryFailedError } from 'typeorm';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | object;
  error?: string;
  correlationId?: string;
  details?: any;
}

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = AppLoggerService.getCorrelationId();

    let status: HttpStatus;
    let message: string | object;
    let error: string;
    let details: any;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors
      status = HttpStatus.BAD_REQUEST;
      message = this.handleDatabaseError(exception);
      error = 'Database Error';
      details = process.env.NODE_ENV === 'development' ? exception.message : undefined;
    } else if (exception instanceof Error) {
      // Generic errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : exception.message;
      error = exception.name;
      details = process.env.NODE_ENV === 'development' ? exception.stack : undefined;
    } else {
      // Unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Unknown Error';
      details = process.env.NODE_ENV === 'development' ? String(exception) : undefined;
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      correlationId,
      ...(details && { details }),
    };

    // Log the exception
    this.logException(exception, request, status, correlationId);

    // Send response
    response.status(status).json(errorResponse);
  }

  private handleDatabaseError(error: QueryFailedError): string {
    const message = error.message;

    // Handle common database constraint violations
    if (message.includes('duplicate key value violates unique constraint')) {
      if (message.includes('email')) {
        return 'Email address already exists';
      }
      if (message.includes('cardNumber')) {
        return 'Card number already exists';
      }
      if (message.includes('code')) {
        return 'Organization code already exists';
      }
      if (message.includes('apiKey')) {
        return 'API key already exists';
      }
      return 'Duplicate entry detected';
    }

    if (message.includes('violates foreign key constraint')) {
      return 'Referenced record does not exist';
    }

    if (message.includes('violates not-null constraint')) {
      return 'Required field is missing';
    }

    if (message.includes('violates check constraint')) {
      return 'Invalid data provided';
    }

    // Default database error message
    return process.env.NODE_ENV === 'production' 
      ? 'Database operation failed' 
      : message;
  }

  private logException(
    exception: unknown,
    request: Request,
    status: HttpStatus,
    correlationId?: string,
  ): void {
    const context = 'GlobalExceptionFilter';
    const user = (request as any).user;

    const errorDetails = {
      path: request.url,
      method: request.method,
      statusCode: status,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: user?.id,
      correlationId,
    };

    if (exception instanceof HttpException) {
      if (status >= 500) {
        // Server errors
        this.logger.error(
          `HTTP ${status} - ${exception.message}`,
          exception.stack,
          context
        );
        this.logger.logSecurityEvent(
          'Server Error',
          'high',
          { ...errorDetails, exception: exception.name }
        );
      } else if (status >= 400) {
        // Client errors (but not auth failures which are already logged)
        if (status !== 401 && status !== 403) {
          this.logger.warn(`HTTP ${status} - ${exception.message}`, context);
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors
      this.logger.error(
        `Database error: ${exception.message}`,
        exception.stack,
        context
      );
      this.logger.logSecurityEvent(
        'Database Error',
        'medium',
        { ...errorDetails, query: exception.query }
      );
    } else {
      // Unknown errors - always log as critical
      this.logger.error(
        `Unhandled exception: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
        context
      );
      this.logger.logSecurityEvent(
        'Unhandled Exception',
        'critical',
        errorDetails
      );
    }
  }
}