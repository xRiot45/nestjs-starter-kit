import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './core/database/database.module';
import { LoggerModule } from './core/logger/logger.module';
import { ModulesModule } from './modules/modules.module';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CqrsModule.forRoot(),
        ThrottlerModule.forRoot([
            {
                ttl: 60,
                limit: 1000,
            },
            {
                ttl: 3600,
                limit: 10000,
            },
            {
                ttl: 86400,
                limit: 100000,
            },
        ]),
        LoggerModule,
        DatabaseModule,
        ModulesModule,
    ],
    providers: [
        ResponseInterceptor,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class MainModule {}
