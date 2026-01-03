export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    timestamp: string;
    data?: T;
    message?: string;
}
