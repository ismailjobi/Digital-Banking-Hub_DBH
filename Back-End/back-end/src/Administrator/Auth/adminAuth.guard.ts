import {
    CanActivate,
    ExecutionContext,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './adminAuthconstants';
import { Request } from 'express';
import { adminAuthService } from './adminAuth.service';
import { Console, error } from 'console';

@Injectable()
export class adminAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService,
        private adminAuthService: adminAuthService,
    ) { }
    private errorMsg: string;
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            );
            if(!await this.adminAuthService.checkValidLoginToken(payload["email"], token)){
                this.errorMsg = "This token is invalid or expired !";
                throw new UnauthorizedException();
            }
            request['adminData'] = payload;
        } catch {
            throw new UnauthorizedException(this.errorMsg);
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}