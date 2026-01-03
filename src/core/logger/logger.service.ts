import { Inject, Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
    ) {}

    /**
     * Logs a message with the "info" level.
     * @param message The message to be logged.
     * @param context The context in which the message was logged.
     */
    log(message: string, context?: string): void {
        this.logger.info(message, { context });
    }

    /**
     * Logs a message with the "warn" level.
     * @param message The message to be logged.
     * @param context The context in which the message was logged.
     */
    warn(message: string, context?: string): void {
        this.logger.warn(message, { context });
    }

    /**
     * Logs a message with the "error" level.
     * @param message The message to be logged.
     * @param trace The stack trace of the error.
     * @param context The context in which the error was logged.
     */
    error(message: string, trace?: string, context?: string): void {
        this.logger.error(message, { trace, context });
    }

    /**
     * Logs a message with the "debug" level.
     * @param message The message to be logged.
     * @param context The context in which the message was logged.
     */
    debug(message: string, context?: string): void {
        this.logger.debug(message, { context });
    }

    /**
     * Logs a message with the "verbose" level.
     * @param message The message to be logged.
     * @param context The context in which the message was logged.
     */
    verbose(message: string, context?: string): void {
        this.logger.verbose(message, { context });
    }
}
