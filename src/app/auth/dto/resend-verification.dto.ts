import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'The email address where the verification link will be resent',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
