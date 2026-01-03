import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from 'src/shared/interfaces/jwt-payload.interface';

export const currentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtPayload | null => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request?.user as JwtPayload;
});
