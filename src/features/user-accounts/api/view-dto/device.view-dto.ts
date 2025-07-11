import { DeviceAuthSessionDocument } from '../../domain/device-auth-session.entity';
import { DeviceAuthSessionDtoSql } from '../../../user-accounts-sql/dto/device-auth-session.dto.sql';
import { DeviceAuthSessionViewRowWrap } from '../../../user-accounts-wrap/infrastructure/query/dto/device-auth-session.view-row.wrap';

export class DeviceViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(deviceAuthSession: DeviceAuthSessionDtoSql): DeviceViewDto {
    const dto = new DeviceViewDto();

    dto.ip = deviceAuthSession.ip;
    dto.title = deviceAuthSession.deviceName;
    dto.lastActiveDate = deviceAuthSession.iat.toISOString();
    dto.deviceId = deviceAuthSession.deviceId;

    return dto;
  }

  static mapToViewMongo(
    deviceAuthSession: DeviceAuthSessionDocument,
  ): DeviceViewDto {
    const dto = new DeviceViewDto();

    dto.ip = deviceAuthSession.ip;
    dto.title = deviceAuthSession.deviceName;
    dto.lastActiveDate = deviceAuthSession.iat.toISOString();
    dto.deviceId = deviceAuthSession.deviceId;

    return dto;
  }

  static mapToViewWrap(row: DeviceAuthSessionViewRowWrap): DeviceViewDto {
    const dto = new DeviceViewDto();

    dto.ip = row.ip;
    dto.title = row.device_name;
    dto.lastActiveDate = row.iat.toISOString();
    dto.deviceId = row.device_id;

    return dto;
  }
}
