export interface JwtPayload {
    sub: string;
    username: string;
    email?: string;
    iat?: number;
    exp?: number;
}
