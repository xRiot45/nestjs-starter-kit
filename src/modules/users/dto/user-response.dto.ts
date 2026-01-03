// src/users/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The unique identifier of the user (UUID)',
    })
    @Expose()
    id: string;

    @ApiProperty({ example: 'johndoe', description: 'The unique username of the user' })
    @Expose()
    username: string;

    @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
    @Expose()
    fullName: string;

    @ApiProperty({ example: 'john@example.com', description: 'The registered email address' })
    @Expose()
    email: string;

    @ApiProperty({
        example: 'https://cdn.example.com/avatars/user1.jpg',
        description: 'URL to the user profile picture',
        nullable: true,
    })
    @Expose()
    avatarUrl: string;

    @ApiProperty({
        example: 'Software Engineer based in Jakarta.',
        description: 'User short biography',
        nullable: true,
    })
    @Expose()
    bio: string;

    @ApiProperty({
        example: '2026-01-03T13:00:00.000Z',
        description: 'Timestamp when the email was verified',
        nullable: true,
        type: String,
        format: 'date-time',
    })
    @Expose()
    emailVerifiedAt: Date | null;

    @ApiProperty({ example: true, description: 'Verification status of the account' })
    @Expose()
    isVerified: boolean;

    @ApiProperty({
        example: '2026-01-01T10:00:00.000Z',
        description: 'Account creation timestamp',
    })
    @Expose()
    createdAt: Date;
}
