import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { isObject } from 'class-validator';
import { Request, Response } from 'express';

interface HttpExceptionResponse {
    message: string | string[];
    error?: string;
    statusCode?: number;
}

interface ErrorResponseBody {
    success: false;
    statusCode: number;
    error: string;
    message: string;
    path: string;
    timestamp: string;
    errors?: string[];
    stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isProduction = process.env.NODE_ENV === 'production';

        let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorName = 'InternalServerError';
        let errors: string[] | undefined = undefined;
        let stack: string | undefined = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse() as HttpExceptionResponse;

            if (typeof res === 'string') {
                message = res;
            } else if (isObject(res)) {
                // Type casting ke interface yang sudah kita buat
                const r = res;

                if (Array.isArray(r.message)) {
                    errors = r.message;
                    message = r.message.join(', ');
                } else if (typeof r.message === 'string') {
                    message = r.message;
                }

                errorName = r.error ?? exception.name;
            }

            if (!isProduction && exception instanceof Error) {
                stack = exception.stack;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            errorName = exception.name;
            stack = isProduction ? undefined : exception.stack;
        }

        // Membangun body dengan tipe ErrorResponseBody
        const responseBody: ErrorResponseBody = {
            success: false,
            statusCode: status,
            error: errorName,
            message,
            path: request.url,
            timestamp: new Date().toISOString(),
            ...(errors ? { errors } : {}),
            ...(stack ? { stack } : {}),
        };

        response.status(status).json(responseBody);
    }
}
