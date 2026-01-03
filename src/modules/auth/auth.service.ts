import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { LoggerService } from 'src/core/logger/logger.service';
import { MailService } from 'src/core/mail/services/mail.service';
import { TokenService } from 'src/core/services/token.service';
import { Repository } from 'typeorm';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserEntity } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        private readonly logger: LoggerService,
        private readonly tokenService: TokenService,
    ) {}

    /**
     * Register a new user in the system.
     * @param registerDto The request data transfer object containing the username, email, password, and full name.
     * @returns A promise of the UserResponseDto containing the newly registered user.
     * @throws ConflictException If the username or email already exists.
     * @throws InternalServerErrorException If an error occurs during the registration process or sending the verification email.
     */
    async register(registerDto: RegisterDto): Promise<UserResponseDto> {
        const context = `${AuthService.name}.register`;
        const { username, email, password, fullName } = registerDto;

        this.logger.log(`Starting registration process for user: ${email}`, context);

        const existingUser = await this.userRepository.findOne({
            where: [{ email }, { username }],
            select: ['id'],
        });

        if (existingUser) {
            this.logger.warn(
                `Registration failed: Conflict detected. Username/Email already exists (${username} / ${email})`,
                context,
            );
            throw new ConflictException('Username or Email already exists');
        }

        this.logger.debug(`Hashing password for ${email}...`, context);
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = this.userRepository.create({
            username,
            email,
            fullName: fullName,
            password: hashedPassword,
        });

        try {
            const savedUser = await this.userRepository.save(newUser);
            this.logger.log(`User created successfully in database with ID: ${savedUser.id}`, context);

            const expiresInEnv = this.configService.get<string>('JWT_VERIFY_EMAIL_EXPIRES_IN');
            const expiresInValue = expiresInEnv ? parseInt(expiresInEnv, 10) : 900;

            const token = this.jwtService.sign(
                {
                    sub: savedUser.id,
                    type: 'verify_email',
                },
                {
                    secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
                    expiresIn: expiresInValue,
                },
            );

            const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
            const verifyLink = `${appUrl}/api/auth/verify-email?token=${token}`;

            this.logger.debug(`Sending verification email to: ${email}`, context);

            await this.mailService.sendMail({
                to: email,
                subject: 'Welcome to ChatApp! Please verify your email',
                template: 'verify-email',
                context: {
                    username: savedUser.username,
                    verifyLink,
                    url: appUrl,
                    year: new Date().getFullYear(),
                },
            });

            this.logger.log(`Registration completed & verification email sent to: ${email}`, context);

            return plainToInstance(UserResponseDto, savedUser, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            this.logger.error(
                `Registration process failed for ${email}: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Failed to register user or send verification email');
        }
    }

    /**
     * Verifies an email address using a verification token sent to the user.
     * The token is generated during the registration process and is valid for a limited time.
     * If the token is invalid or has expired, an UnauthorizedException is thrown.
     * If the token is valid, the user's isVerified status is updated to true.
     * If the user's isVerified status is already true, the request is skipped.
     * @param token The verification token sent to the user.
     * @returns A Promise that resolves when the email verification is successful.
     * @throws UnauthorizedException If the token is invalid or has expired.
     * @throws ConflictException If the user's isVerified status cannot be updated.
     * @throws NotFoundException If the user with the given ID is not found.
     */
    async verifyEmail(token: string): Promise<void> {
        const context = `${AuthService.name}.verifyEmail`;
        let payload: { sub: string; type: string };

        this.logger.log('Processing email verification request...', context);

        try {
            payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
            });
        } catch (error) {
            this.logger.warn(
                `Verification failed: Token is invalid or has expired. Error: ${(error as Error).message}`,
                context,
            );
            throw new UnauthorizedException('Invalid verification link');
        }

        if (payload.type !== 'verify_email') {
            this.logger.error(
                `Security Warning: Token type mismatch! Expected: verify_email, Got: ${payload.type}`,
                context,
            );
            throw new UnauthorizedException('Invalid verification link');
        }

        const userId = payload.sub;

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'isVerified', 'email'],
        });

        if (!user) {
            this.logger.warn(`Verification failed: User with ID ${userId} not found`, context);
            throw new NotFoundException('User not found');
        }

        if (user.isVerified) {
            this.logger.log(`User ${user.email} (ID: ${userId}) already verified. Skipping update.`, context);
            return;
        }

        this.logger.debug(`Attempting to update verification status for user: ${user.email}`, context);

        const updateResult = await this.userRepository.update(
            { id: userId, isVerified: false },
            {
                isVerified: true,
                emailVerifiedAt: new Date(),
            },
        );

        if (updateResult.affected === 0) {
            const recheckUser = await this.userRepository.findOne({ where: { id: userId } });
            if (recheckUser && recheckUser.isVerified) {
                this.logger.log(`Conflict handled: User ${userId} was verified by another request.`, context);
                return;
            }

            this.logger.error(`Failed to update isVerified status for userId=${userId}. Affected rows is 0.`, context);
            throw new ConflictException('Failed to verify email');
        }

        this.logger.log(
            `Email successfully verified for ${user.email} (ID: ${userId}) at ${new Date().toISOString()}`,
            context,
        );
    }

    /**
     * Log in a user in the system.
     * @param loginDto The request data transfer object containing the email and password.
     * @returns A promise of the LoginResponseDto containing the JWT access token, JWT refresh token, and the user's ID.
     * @throws UnauthorizedException If the email or password is invalid.
     * @throws ForbiddenException If the user has not verified their email.
     * @throws InternalServerErrorException If an error occurs during the login process or generating the JWT tokens.
     */
    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        const context = `${AuthService.name}.login`;
        const { email, password } = loginDto;

        this.logger.log(`Login attempt for email: ${email}`, context);

        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'isVerified', 'username'],
        });

        if (!user) {
            this.logger.warn(`Login failed: User with email ${email} not found`, context);
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            this.logger.warn(`Login failed: Invalid password for user ${email}`, context);
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isVerified) {
            this.logger.warn(`Login blocked: User ${email} has not verified their email`, context);
            throw new ForbiddenException('Please verify your email address first');
        }

        try {
            this.logger.debug(`Generating tokens for user: ${user.username} (ID: ${user.id})`, context);
            const tokens = await this.tokenService.generateTokens(user.id, user.email);

            await this.tokenService.updateRefreshTokenHash(user.id, tokens.refreshToken);

            this.logger.log(`Login successful: User ${user.email} is now authenticated`, context);

            return tokens;
        } catch (error) {
            this.logger.error(
                `Unexpected error during login for ${email}: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('An error occurred during login');
        }
    }

    /**
     * Logout a user from the system.
     * @param userId The ID of the user to be logged out.
     * @returns A promise that resolves when the user is successfully logged out.
     * @throws NotFoundException If the user with the given ID is not found.
     */
    async logout(userId: string): Promise<void> {
        const context = `${AuthService.name}.logout`;
        this.logger.log(`User ${userId} is logging out`, context);

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.tokenService.removeRefreshToken(userId);
    }

    /**
     * Retrieves the current user associated with the given user ID.
     * @param userId The ID of the user to be retrieved.
     * @returns A promise of the UserResponseDto containing the user's information.
     * @throws NotFoundException If the user with the given ID is not found.
     * @throws InternalServerErrorException If an unexpected error occurs during the retrieval of the user.
     */
    async getCurrentUser(userId: string): Promise<UserResponseDto> {
        const context = `${AuthService.name}.getCurrentUser`;
        this.logger.log(`Fetching current user with ID: ${userId}`, context);

        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                this.logger.warn(`User not found: ${userId}`, context);
                throw new NotFoundException('User not found');
            }

            return plainToInstance(UserResponseDto, user, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            if (error instanceof NotFoundException) throw error;

            this.logger.error(`Unexpected error fetching user ${userId}: ${(error as Error).message}`, context);
            throw new InternalServerErrorException('Failed to fetch user', context);
        }
    }

    /**
     * Refreshes the access token and refresh token for the given user ID.
     * Verifies the given refresh token against the stored refresh token in the database.
     * If the token is invalid or expired, an UnauthorizedException is thrown.
     * If the stored refresh token does not match the given refresh token, a ForbiddenException is thrown.
     * If an unexpected error occurs during the refresh process or generating the JWT tokens, an InternalServerErrorException is thrown.
     * @param userId The ID of the user to refresh the tokens for.
     * @param refreshToken The refresh token provided by the client.
     * @returns A promise of the LoginResponseDto containing the new access token, refresh token, and the user's ID.
     * @throws UnauthorizedException If the refresh token is invalid or expired.
     * @throws ForbiddenException If the stored refresh token does not match the given refresh token.
     * @throws NotFoundException If the user with the given ID is not found.
     * @throws InternalServerErrorException If an unexpected error occurs during the refresh process or generating the JWT tokens.
     */
    async refreshTokens(userId: string, refreshToken: string): Promise<LoginResponseDto> {
        const context = `${AuthService.name}.refreshTokens`;
        this.logger.log(`Attempting to refresh tokens for User ID: ${userId}`, context);

        try {
            try {
                this.jwtService.verify(refreshToken, {
                    secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                });
            } catch (error) {
                this.logger.warn(
                    `Invalid or expired refresh token for User: ${userId} ${(error as Error).message}`,
                    context,
                );
                throw new UnauthorizedException('Refresh token expired or invalid');
            }

            const isMatch = await this.tokenService.isRefreshTokenMatches(userId, refreshToken);
            if (!isMatch) {
                this.logger.error(
                    `Security Alert: Refresh token mismatch for User: ${userId}. Possible token theft or reuse attempt!`,
                    context,
                );
                throw new ForbiddenException('Access Denied');
            }

            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                this.logger.warn(`Refresh failed: User ${userId} not found in database`, context);
                throw new NotFoundException('User not found');
            }

            this.logger.debug(`Generating new token pair for User: ${user.email}`, context);
            const tokens = await this.tokenService.generateTokens(user.id, user.email);

            await this.tokenService.updateRefreshTokenHash(user.id, tokens.refreshToken);

            this.logger.log(`Tokens successfully rotated for User: ${user.email}`, context);
            return tokens;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `Unexpected error during token refresh for User ${userId}: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Failed to refresh tokens');
        }
    }

    /**
     * Handles a forgot password request by sending a reset link to the user's email address.
     * If the user is not found, the request is skipped and no error is thrown.
     * @param forgotPasswordDto The request data transfer object containing the email address.
     * @returns A promise that resolves when the reset password email is successfully sent.
     * @throws InternalServerErrorException If an error occurs during the sending of the email.
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
        const context = `${AuthService.name}.forgotPassword`;
        const { email } = forgotPasswordDto;

        this.logger.log(`Forgot password request for email: ${email}`, context);

        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            this.logger.warn(`Forgot password failed: User ${email} not found`, context);
            return;
        }

        const secret = this.configService.get<string>('JWT_FORGOT_PASSWORD_SECRET');
        const expiresIn = this.configService.get<string>('JWT_FORGOT_PASSWORD_EXPIRES_IN') || '3600';

        const token = this.jwtService.sign(
            { sub: user.id, type: 'forgot_password' },
            { secret, expiresIn: parseInt(expiresIn) },
        );

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        try {
            await this.mailService.sendMail({
                to: email,
                subject: 'Reset your password',
                template: 'forgot-password',
                context: {
                    username: user.username,
                    resetLink,
                    year: new Date().getFullYear(),
                },
            });

            this.logger.log(`Forgot password email sent successfully to ${email}`, context);
        } catch (error) {
            this.logger.error(
                `Failed to send forgot password email to ${email}: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Error sending email');
        }
    }

    /**
     * Resets a user's password using a valid reset token.
     * @param resetPasswordDto The request data transfer object containing the reset token and new password.
     * @returns A promise that resolves when the password is successfully reset.
     * @throws UnauthorizedException If the reset token is invalid or has expired.
     * @throws NotFoundException If the user with the given ID is not found.
     * @throws InternalServerErrorException If an error occurs during the password reset process or updating the user in the database.
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
        const context = `${AuthService.name}.resetPassword`;
        const { token, newPassword } = resetPasswordDto;

        this.logger.log('Attempting to reset password using token', context);

        let payload: { sub: string; type: string };

        try {
            payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_FORGOT_PASSWORD_SECRET'),
            });
        } catch {
            this.logger.warn(`Invalid or expired reset password token`, context);
            throw new UnauthorizedException('Invalid or expired reset link');
        }

        if (payload.type !== 'forgot_password') {
            this.logger.error(`Security Warning: Token type mismatch in reset password!`, context);
            throw new UnauthorizedException('Invalid reset link');
        }

        const user = await this.userRepository.findOne({
            where: { id: payload.sub },
        });
        if (!user) throw new NotFoundException('User not found');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        try {
            await this.userRepository.update(user.id, {
                password: hashedPassword,
                currentRefreshToken: null,
            });

            this.logger.log(`Password successfully reset for user ID: ${user.id}`, context);
        } catch (error) {
            this.logger.error(
                `Error updating password in database: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Failed to reset password');
        }
    }

    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Resends a verification email to the user with the given email address.
     * @param resendDto The request data transfer object containing the email address.
     * @returns A promise that resolves when the verification email is successfully sent.
     * @throws NotFoundException If the user with the given email address is not found.
     * @throws BadRequestException If the user with the given email address is already verified.
     * @throws InternalServerErrorException If an unexpected error occurs during the sending of the verification email.
    /*******  2280bce7-70f8-436f-8b7c-7987c6e8b39f  *******/
    async resendVerificationEmail(resendDto: ResendVerificationDto): Promise<void> {
        const context = `${AuthService.name}.resendVerificationEmail`;
        const { email } = resendDto;

        this.logger.log(`Resend verification requested for email: ${email}`, context);

        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'username', 'email', 'isVerified'],
        });

        if (!user) {
            this.logger.warn(`Resend failed: User with email ${email} not found`, context);
            throw new NotFoundException('User not found');
        }

        if (user.isVerified) {
            this.logger.log(`Resend skipped: User ${email} is already verified`, context);
            throw new BadRequestException('Email is already verified');
        }

        try {
            const expiresInEnv = this.configService.get<string>('JWT_VERIFY_EMAIL_EXPIRES_IN');
            const expiresInValue = expiresInEnv ? parseInt(expiresInEnv, 10) : 900;

            const token = this.jwtService.sign(
                { sub: user.id, type: 'verify_email' },
                {
                    secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
                    expiresIn: expiresInValue,
                },
            );

            const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
            const verifyLink = `${appUrl}/api/auth/verify-email?token=${token}`;

            await this.mailService.sendMail({
                to: email,
                subject: 'Resend: Please verify your email',
                template: 'verify-email',
                context: {
                    username: user.username,
                    verifyLink,
                    url: appUrl,
                    year: new Date().getFullYear(),
                },
            });

            this.logger.log(`Verification email successfully resent to ${email}`, context);
        } catch (error) {
            this.logger.error(
                `Failed to resend verification email to ${email}: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Failed to resend verification email');
        }
    }

    /**
     * Changes the password for a user.
     * @param userId The ID of the user to change the password for.
     * @param changePasswordDto The request data transfer object containing the old password and new password.
     * @returns A promise that resolves when the password is successfully changed.
     * @throws NotFoundException If the user with the given ID is not found.
     * @throws BadRequestException If the old password does not match the user's current password.
     * @throws InternalServerErrorException If an error occurs during the password change process or updating the user in the database.
     */
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
        const context = `${AuthService.name}.changePassword`;
        const { oldPassword, newPassword } = changePasswordDto;

        this.logger.log(`Attempting to change password for user ID: ${userId}`, context);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'password', 'email'],
        });

        if (!user) {
            this.logger.error(`User not found during password change: ${userId}`, context);
            throw new NotFoundException('User not found');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            this.logger.warn(`Password change failed: Incorrect old password for user ${user.email}`, context);
            throw new BadRequestException('Old password does not match');
        }
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        try {
            await this.userRepository.update(userId, {
                password: hashedPassword,
                currentRefreshToken: null,
            });

            this.logger.log(`Password successfully changed for user: ${user.email}`, context);
        } catch (error) {
            this.logger.error(
                `Failed to update password in DB: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Failed to update password');
        }
    }

    /**
     * Deletes a user account from the system.
     * The account is deleted if the provided password matches the user's current password.
     * If the password is invalid, a BadRequestException is thrown.
     * If the user is not found, a NotFoundException is thrown.
     * If an error occurs during the deletion process, an InternalServerErrorException is thrown.
     * @param userId The ID of the user to be deleted.
     * @param deleteAccountDto The request data transfer object containing the password to verify.
     * @returns A promise that resolves when the account is successfully deleted.
     * @throws BadRequestException If the password does not match the user's current password.
     * @throws NotFoundException If the user with the given ID is not found.
     * @throws InternalServerErrorException If an error occurs during the deletion process or updating the user in the database.
     */
    async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto): Promise<void> {
        const context = `${AuthService.name}.deleteAccount`;
        const { password } = deleteAccountDto;

        this.logger.log(`Account deletion request for user ID: ${userId}`, context);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'password', 'email'],
        });

        if (!user) {
            this.logger.error(`User not found during deletion: ${userId}`, context);
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            this.logger.warn(`Deletion failed: Incorrect password for user ${user.email}`, context);
            throw new BadRequestException('Invalid password. Account deletion aborted.');
        }

        try {
            await this.userRepository.delete(userId);

            this.logger.log(`Account permanently deleted: ${user.email} (ID: ${userId})`, context);
        } catch (error) {
            this.logger.error(
                `Database error during user deletion: ${(error as Error).message}`,
                (error as Error).stack,
                context,
            );
            throw new InternalServerErrorException('Failed to delete account. Please try again later.');
        }
    }
}
