import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger.config';
import { LoggerService } from './logger.service';

@Module({
    imports: [WinstonModule.forRoot(winstonConfig)],
    providers: [LoggerService],
    exports: [LoggerService],
})
export class LoggerModule {}
