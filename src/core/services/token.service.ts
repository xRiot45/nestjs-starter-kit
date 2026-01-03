import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

interface Tokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class TokenService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async generateTokens(userId: string, email: string): Promise<Tokens> {
        const payload = { sub: userId, email: email };

        const accessTokenExp = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '3600';
        const refreshTokenExp = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '604800';

        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                expiresIn: parseInt(accessTokenExp, 10),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                expiresIn: parseInt(refreshTokenExp, 10),
            }),
        ]);

        return {
            accessToken: at,
            refreshToken: rt,
        };
    }

    async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(refreshToken, salt);

        await this.userRepository.update(userId, {
            currentRefreshToken: hash,
        });
    }

    async removeRefreshToken(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            currentRefreshToken: null,
        });
    }

    async isRefreshTokenMatches(userId: string, refreshToken: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user || !user.currentRefreshToken) return false;

        return bcrypt.compare(refreshToken, user.currentRefreshToken);
    }
}
