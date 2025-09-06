import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { WinstonModuleOptions } from 'nest-winston';

export interface LoggerConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  enableTypeORM: boolean;
  enableHttpLogs: boolean;
  format: 'json' | 'simple' | 'combined';
}

export const getLoggerConfig = (): LoggerConfig => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        level: 'warn',
        enableConsole: true,
        enableFile: true,
        enableDatabase: false,
        enableTypeORM: false,
        enableHttpLogs: false,
        format: 'json',
      };
    case 'test':
      return {
        level: 'error',
        enableConsole: false,
        enableFile: false,
        enableDatabase: false,
        enableTypeORM: false,
        enableHttpLogs: false,
        format: 'simple',
      };
    case 'development':
    default:
      return {
        level: 'debug',
        enableConsole: true,
        enableFile: true,
        enableDatabase: true,
        enableTypeORM: Boolean(process.env.ENABLE_TYPEORM_LOGS === 'true'),
        enableHttpLogs: true,
        format: 'combined',
      };
  }
};

export const createWinstonConfig = (): WinstonModuleOptions => {
  const config = getLoggerConfig();
  const transports: winston.transport[] = [];

  // Console transport
  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.printf(({ timestamp, level, message, context, trace, correlationId, ...meta }) => {
            let log = `${timestamp} [${level.toUpperCase()}]`;
            
            if (correlationId) {
              log += ` [${correlationId}]`;
            }
            
            if (context) {
              log += ` [${context}]`;
            }
            
            log += ` ${message}`;
            
            if (Object.keys(meta).length) {
              log += ` ${JSON.stringify(meta)}`;
            }
            
            if (trace) {
              log += `\n${trace}`;
            }
            
            return log;
          }),
          winston.format.colorize({ all: true })
        ),
      })
    );
  }

  // File transport
  if (config.enableFile) {
    // Error logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );

    // Combined logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );
  }

  return {
    level: config.level,
    transports,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    defaultMeta: {
      service: 'myfuel-api',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  };
};