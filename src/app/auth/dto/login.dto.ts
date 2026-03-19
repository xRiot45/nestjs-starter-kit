import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'The email address associated with the account',
    })
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'password123',
        description: 'The password associated with the account',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class LoginResponseDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1...',
        description: 'The access token issued by the server',
    })
    @Expose()
    accessToken: string;

    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1...',
        description: 'The refresh token issued by the server',
    })
    @Expose()
    refreshToken: string;
}
