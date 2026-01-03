import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
    @ApiProperty({
        example: 'myStrongPassword123!',
        description: 'The current password of the user to confirm account deletion',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}
