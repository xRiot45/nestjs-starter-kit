import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'The email address associated with the account',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1...',
        description: 'The reset token received via email',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        example: 'newPassword123!',
        description: 'The new password for the account (min 6 characters)',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
