import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import winston from 'winston';
import 'winston-daily-rotate-file';

export const winstonConfig: winston.LoggerOptions = {
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                nestWinstonModuleUtilities.format.nestLike('Nest', {
                    colors: true,
                    prettyPrint: true,
                }),
            ),
        }),

        new winston.transports.DailyRotateFile({
            dirname: 'logs',
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '5m',
            maxFiles: '14d',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.json(),
            ),
        }),

        new winston.transports.DailyRotateFile({
            dirname: 'logs',
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.json(),
            ),
        }),
    ],
};
