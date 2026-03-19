import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'oldPassword123!',
        description: 'The current password of the user',
    })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({
        example: 'newSecurePassword456!',
        description: 'The new password (must be at least 6 characters)',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
