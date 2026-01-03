import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'johndoe', description: 'Unique username' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    username: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    fullName: string;

    @ApiProperty({ example: 'john@example.com', description: 'User email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password (min 6 chars)', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;
}
