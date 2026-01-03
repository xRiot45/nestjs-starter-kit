import { Expose, Type } from 'class-transformer';

export class BaseResponseDto<T = void> {
    @Expose()
    success: boolean;

    @Expose()
    statusCode: number;

    @Expose()
    @Type(() => Date)
    timestamp: Date;

    @Expose()
    message?: string;

    @Expose()
    data?: T;
}
