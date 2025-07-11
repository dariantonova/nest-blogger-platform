import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthTokensDto } from '../../../user-accounts/dto/auth-tokens.dto';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../user-accounts/constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { RefreshJWTPayload } from '../../../user-accounts/dto/refresh-jwt-payload';
import { unixToDate } from '../../../../common/utils/date.util';
import { DeviceAuthSessionsRepositorySql } from '../../infrastructure/device-auth-sessions.repository.sql';

export class RefreshTokenCommandSql {
  constructor(public dto: { userId: number; deviceId: string; ip: string }) {}
}

@CommandHandler(RefreshTokenCommandSql)
export class RefreshTokenUseCaseSql
  implements ICommandHandler<RefreshTokenCommandSql, AuthTokensDto>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
    private deviceAuthSessionsRepository: DeviceAuthSessionsRepositorySql,
  ) {}

  async execute({ dto }: RefreshTokenCommandSql): Promise<AuthTokensDto> {
    const accessToken = this.accessTokenContext.sign({ userId: dto.userId });
    const refreshToken = this.refreshTokenContext.sign({
      userId: dto.userId,
      deviceId: dto.deviceId,
    });

    const refreshTokenPayload: RefreshJWTPayload =
      this.refreshTokenContext.decode(refreshToken);

    await this.updateDeviceAuthSession(
      dto.userId,
      dto.deviceId,
      refreshTokenPayload.exp,
      refreshTokenPayload.iat,
      dto.ip,
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: unixToDate(refreshTokenPayload.exp),
    };
  }

  private async updateDeviceAuthSession(
    userId: number,
    deviceId: string,
    expUnix: number,
    iatUnix: number,
    ip: string,
  ): Promise<void> {
    await this.deviceAuthSessionsRepository.updateDeviceAuthSession(
      userId,
      deviceId,
      unixToDate(expUnix),
      unixToDate(iatUnix),
      ip,
    );
  }
}
