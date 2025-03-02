import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/commons/decorators/public.decorator';
import { ROLES_KEY } from 'src/commons/decorators/roles.decorator';
import { ROLE } from 'src/commons/enums/user.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check API có public không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check xem user có thuộc hệ thống không
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token && !isPublic) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwtAuth').jwtTokenSecret,
      });

      request['user'] = payload;
    } catch {
      if (!isPublic) {
        throw new UnauthorizedException();
      }
    }

    if (isPublic) {
      return true;
    }

    // Check role user
    const requiredRoles = this.reflector.getAllAndOverride<ROLE[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const result = requiredRoles.some((role) => user.role?.includes(role));

    return result;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
