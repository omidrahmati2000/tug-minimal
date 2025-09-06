import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { AppLoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [CacheService, AppLoggerService],
  exports: [CacheService, AppLoggerService],
})
export class CommonModule {}