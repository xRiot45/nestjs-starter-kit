import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1...',
        description: 'The refresh token issued by the server',
    })
    @IsString()
    refreshToken: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4....',
        description: 'The user ID associated with the refresh token',
    })
    @IsString()
    userId: string;
}
