import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';
import { ApiResponse } from 'src/shared/interfaces/api-response.interface';
import { isCustomFormattedResponse } from 'src/shared/utils/custom-formatted-response.util';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data: T | Partial<ApiResponse<T>> | undefined | null): ApiResponse<T> => {
                if (typeof data === 'object' && data !== null && 'data' in data && 'meta' in data && 'links' in data) {
                    return {
                        success: true,
                        statusCode,
                        timestamp: new Date().toISOString(),
                        ...data,
                    } as ApiResponse<T>;
                }

                if (isCustomFormattedResponse(data)) {
                    return {
                        ...data,
                        statusCode: statusCode,
                        timestamp: new Date().toISOString(),
                    } as ApiResponse<T>;
                }

                if (data === undefined || data === null) {
                    return {
                        success: true,
                        statusCode: statusCode,
                        timestamp: new Date().toISOString(),
                        message: 'Operation successful (no content)',
                        data: null as T,
                    };
                }

                return {
                    success: true,
                    statusCode: statusCode,
                    timestamp: new Date().toISOString(),
                    message: 'Operation successful',
                    data: data as T,
                };
            }),
        );
    }
}
