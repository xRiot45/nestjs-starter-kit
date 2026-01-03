import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export interface JwtConfig {
    access: JwtModuleOptions;
    refresh: JwtModuleOptions;
}

export default registerAs(
    'jwt',
    (): JwtConfig => ({
        access: {
            secret: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
            signOptions: {
                expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ? parseInt(process.env.JWT_ACCESS_EXPIRES_IN, 10) : 900, // default 15 minutes
            },
        },
        refresh: {
            secret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
            signOptions: {
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
                    ? parseInt(process.env.JWT_REFRESH_EXPIRES_IN, 10)
                    : 604800, // default 7 days
            },
        },
    }),
);
