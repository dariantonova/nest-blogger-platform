import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuardWrap extends AuthGuard('jwt-refresh-wrap') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException({ info });
    }
    return user;
  }
}
