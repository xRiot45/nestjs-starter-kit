import {
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { ApiDocGenericResponse } from 'src/common/decorators/api-doc.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BaseResponseDto } from 'src/shared/dto/base-response.dto';
import type { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @ApiDocGenericResponse({
        summary: 'Register New User',
        description:
            'Create a new user account and send a verification email. Returns a success message if the data is valid.',
        status: HttpStatus.CREATED,
        body: RegisterDto,
    })
    // @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto): Promise<BaseResponseDto> {
        await this.authService.register(registerDto);
        return {
            success: true,
            statusCode: HttpStatus.CREATED,
            timestamp: new Date(),
            message: 'Registration successful. Please check your email to verify your account.',
        };
    }

    @ApiDocGenericResponse({
        summary: 'Verify User Email',
        description:
            'Verify a user email address by providing a verification token. Returns a success message if the token is valid.',
        status: HttpStatus.OK,
        auth: false,
    })
    // @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Get('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Query('token') token: string, @Res() res: Response): Promise<void> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

        try {
            await this.authService.verifyEmail(token);
            return res.redirect(`${frontendUrl}/verify-email?status=success`);
        } catch (error: unknown) {
            let errorCode = 'UNKNOWN_ERROR';

            if (error instanceof UnauthorizedException) {
                errorCode = 'INVALID_TOKEN';
            } else if (error instanceof ConflictException) {
                errorCode = 'ALREADY_VERIFIED';
            }

            return res.redirect(`${frontendUrl}/verify-email?status=failed&code=${errorCode}`);
        }
    }

    @ApiDocGenericResponse({
        summary: 'User Login',
        description:
            'Authenticate a user by providing email and password. Returns a JWT token if the credentials are valid.',
        status: HttpStatus.OK,
        body: LoginDto,
    })
    // @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<BaseResponseDto<LoginResponseDto>> {
        const data = await this.authService.login(loginDto);
        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Login successful',
            data,
        };
    }

    @ApiDocGenericResponse({
        summary: 'User Logout',
        description: 'Logout a user by revoking their JWT token. Returns a success message.',
        status: HttpStatus.OK,
        auth: true,
    })
    // @Throttle({ default: { limit: 3, ttl: 60000 } })
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: AuthenticatedRequest): Promise<BaseResponseDto> {
        const userId = req.user.sub;
        await this.authService.logout(userId);

        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Logout successful',
        };
    }

    @ApiDocGenericResponse({
        summary: 'Get Current User',
        description: 'Get the details of the currently authenticated user. Returns a user object.',
        status: HttpStatus.OK,
        auth: true,
    })
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@Req() req: AuthenticatedRequest): Promise<BaseResponseDto<UserResponseDto>> {
        const userId = req.user.sub;
        const data = await this.authService.getCurrentUser(userId);
        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'User details fetched successfully',
            data,
        };
    }

    @ApiDocGenericResponse({
        summary: 'Refresh JWT Token',
        description:
            'Refresh a user JWT token by providing a refresh token. Returns a new JWT token if the refresh token is valid.',
        status: HttpStatus.OK,
        body: RefreshTokenDto,
    })
    // @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() { userId, refreshToken }: RefreshTokenDto): Promise<BaseResponseDto<LoginResponseDto>> {
        const data = await this.authService.refreshTokens(userId, refreshToken);
        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Token refreshed successfully',
            data,
        };
    }

    @ApiDocGenericResponse({
        summary: 'Forgot Password',
        description:
            'Send a password reset email to the user with a valid reset token. Returns a success message if the email is valid.',
        status: HttpStatus.OK,
        body: ForgotPasswordDto,
    })
    // @Throttle({ default: { limit: 2, ttl: 60000 } })
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<BaseResponseDto> {
        await this.authService.forgotPassword(forgotPasswordDto);
        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Password reset email sent successfully',
        };
    }

    @ApiDocGenericResponse({
        summary: 'Reset Password',
        description:
            'Reset a user password using a valid reset token. Returns a success message if the token is valid.',
        status: HttpStatus.OK,
        body: ResetPasswordDto,
    })
    // @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<BaseResponseDto> {
        await this.authService.resetPassword(resetPasswordDto);
        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Password reset successful',
        };
    }

    @ApiDocGenericResponse({
        summary: 'Resend Verification Email',
        description:
            'Resend a verification email to the user with a valid verification token. Returns a success message if the email is valid.',
        status: HttpStatus.OK,
        body: ResendVerificationDto,
    })
    // @Throttle({ default: { limit: 2, ttl: 60000 } })
    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    async resendVerification(@Body() resendDto: ResendVerificationDto): Promise<BaseResponseDto> {
        await this.authService.resendVerificationEmail(resendDto);
        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Verification email sent successfully',
        };
    }

    @ApiDocGenericResponse({
        summary: 'Change Password',
        description:
            'Change the password of the authenticated user. Returns a success message if the password is changed successfully.',
        status: HttpStatus.OK,
        body: ChangePasswordDto,
        auth: true,
    })
    // @Throttle({ default: { limit: 3, ttl: 60000 } })
    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Req() req: AuthenticatedRequest,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<BaseResponseDto> {
        const userId = req.user.sub;
        await this.authService.changePassword(userId, changePasswordDto);

        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Your password has been changed successfully. Please login again.',
        };
    }

    @ApiDocGenericResponse({
        summary: 'Delete Account',
        description:
            'Delete the account of the authenticated user. Returns a success message if the account is deleted successfully.',
        status: HttpStatus.OK,
        body: DeleteAccountDto,
        auth: true,
    })
    // @Throttle({ default: { limit: 2, ttl: 60000 } })
    @UseGuards(JwtAuthGuard)
    @Delete('delete-account')
    @HttpCode(HttpStatus.OK)
    async deleteAccount(
        @Req() req: AuthenticatedRequest,
        @Body() deleteAccountDto: DeleteAccountDto,
    ): Promise<BaseResponseDto> {
        const userId = req.user.sub;
        await this.authService.deleteAccount(userId, deleteAccountDto);

        return {
            success: true,
            statusCode: HttpStatus.OK,
            timestamp: new Date(),
            message: 'Your account has been permanently deleted. We are sorry to see you go.',
        };
    }
}
