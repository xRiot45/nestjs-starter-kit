import { JwtPayload } from 'src/modules/auth/application/interfaces/jwt-payload.interface';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
