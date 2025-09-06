import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Card } from '../cards/entities/card.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { FuelStation } from '../fuel-stations/entities/fuel-station.entity';
import { getLoggerConfig } from '../common/logger/logger.config';

const getTypeOrmLogging = (): boolean | 'all' | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[] => {
  const loggerConfig = getLoggerConfig();
  
  if (!loggerConfig.enableTypeORM) {
    return false;
  }

  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return ['error', 'warn', 'migration'];
    case 'test':
      return false;
    case 'development':
    default:
      // Only enable if explicitly requested via environment variable
      return process.env.ENABLE_TYPEORM_LOGS === 'true' 
        ? ['query', 'error', 'warn', 'info', 'log', 'migration']
        : ['error', 'warn', 'migration'];
  }
};

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'myfuel',
  entities: [User, Organization, Card, Transaction, FuelStation],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: getTypeOrmLogging(),
  maxQueryExecutionTime: 1000, // Log slow queries (>1s)
  extra: {
    // Connection pool settings
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    min: parseInt(process.env.DB_MIN_CONNECTIONS) || 5,
    acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
    idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
  },
};