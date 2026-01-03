import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('DB_HOST'),
                port: parseInt(configService.get<string>('DB_PORT') ?? '3306', 10),
                database: configService.get<string>('DB_NAME'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
                autoLoadEntities: true,
            }),
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseModule {}
