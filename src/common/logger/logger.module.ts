import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppLoggerService } from './logger.service';
import { createWinstonConfig } from './logger.config';

@Module({
  imports: [
    WinstonModule.forRoot(createWinstonConfig()),
  ],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}