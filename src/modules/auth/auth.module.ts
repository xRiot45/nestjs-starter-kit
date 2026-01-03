import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from 'src/core/logger/logger.service';
import { MailService } from 'src/core/mail/services/mail.service';
import { UserEntity } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from 'src/core/services/token.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [AuthController],
    providers: [AuthService, JwtService, MailService, LoggerService, TokenService],
})
export class AuthModule {}
