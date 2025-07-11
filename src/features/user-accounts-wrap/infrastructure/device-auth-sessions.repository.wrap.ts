import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DeviceAuthSessionWrap } from '../domain/device-auth-session.wrap';
import { getValuesFromDtoToUpdate } from '../../wrap/utils/get-values-from-dto-to-update';
import { buildUpdateSetClause } from '../../wrap/utils/build-update-set-clause';

@Injectable()
export class DeviceAuthSessionsRepositoryWrap {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async save(session: DeviceAuthSessionWrap): Promise<DeviceAuthSessionWrap> {
    if (!session.id) {
      await this.createDeviceAuthSession(session);
    } else {
      const { id, ...dtoToUpdate } = session;
      await this.updateDeviceAuthSession(id, dtoToUpdate);
    }

    return session;
  }

  async findByDeviceIdAndIatAndUserId(
    deviceId: string,
    iat: Date,
    userId: number,
  ): Promise<DeviceAuthSessionWrap | null> {
    const findQuery = `
    ${this.buildSelectFromClause()}
    WHERE d.device_id = $1
    AND d.iat = $2
    AND d.user_id = $3;
    `;
    const findResult = await this.dataSource.query(findQuery, [
      deviceId,
      iat,
      userId,
    ]);

    return findResult[0]
      ? DeviceAuthSessionWrap.reconstitute(findResult[0])
      : null;
  }

  async findByDeviceIdAndUserId(
    deviceId: string,
    userId: number,
  ): Promise<DeviceAuthSessionWrap | null> {
    const findQuery = `
    ${this.buildSelectFromClause()}
    WHERE d.device_id = $1
    AND d.user_id = $2;
    `;
    const findResult = await this.dataSource.query(findQuery, [
      deviceId,
      userId,
    ]);

    return findResult[0]
      ? DeviceAuthSessionWrap.reconstitute(findResult[0])
      : null;
  }

  async findByDeviceIdAndUserIdOrInternalFail(
    deviceId: string,
    userId: number,
  ): Promise<DeviceAuthSessionWrap> {
    const deviceAuthSession = await this.findByDeviceIdAndUserId(
      deviceId,
      userId,
    );

    if (!deviceAuthSession) {
      throw new Error('Device auth session not found');
    }

    return deviceAuthSession;
  }

  async findManyByDeviceId(deviceId: string): Promise<DeviceAuthSessionWrap[]> {
    const findQuery = `
    ${this.buildSelectFromClause()}
    WHERE d.device_id = $1;
    `;
    const findResult = await this.dataSource.query(findQuery, [deviceId]);

    return findResult.map(DeviceAuthSessionWrap.reconstitute);
  }

  async deleteUserDeviceAuthSessions(userId: number): Promise<void> {
    const deleteQuery = `
    DELETE FROM device_auth_sessions
    WHERE user_id = $1;
    `;
    await this.dataSource.query(deleteQuery, [userId]);
  }

  async deleteByDeviceIdAndUserId(
    deviceId: string,
    userId: number,
  ): Promise<void> {
    const deleteQuery = `
    DELETE FROM device_auth_sessions
    WHERE device_id = $1
    AND user_id = $2;
    `;
    await this.dataSource.query(deleteQuery, [deviceId, userId]);
  }

  async deleteUserDeviceAuthSessionsExceptCurrent(
    userId: number,
    currentDeviceId: string,
  ): Promise<void> {
    const deleteQuery = `
    DELETE FROM device_auth_sessions
    WHERE user_id = $1
    AND device_id != $2;
    `;
    await this.dataSource.query(deleteQuery, [userId, currentDeviceId]);
  }

  private buildSelectFromClause(): string {
    return `
    SELECT
    d.id, d.device_id, d.user_id, d.exp, d.iat, d.device_name, d.ip
    FROM device_auth_sessions d
    `;
  }

  private async createDeviceAuthSession(
    session: DeviceAuthSessionWrap,
  ): Promise<void> {
    const createQuery = `
    INSERT INTO device_auth_sessions
    (device_id, user_id, exp, iat, device_name, ip)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;
    `;
    const createResult = await this.dataSource.query(createQuery, [
      session.deviceId,
      session.userId,
      session.exp,
      session.iat,
      session.deviceName,
      session.ip,
    ]);

    session.id = createResult[0];
  }

  private async updateDeviceAuthSession(
    id: number,
    dtoToUpdate: Partial<DeviceAuthSessionWrap>,
  ): Promise<void> {
    const newValues = getValuesFromDtoToUpdate(dtoToUpdate);
    const updateSetClause = buildUpdateSetClause(dtoToUpdate);

    const updateQuery = `
    UPDATE device_auth_sessions
    ${updateSetClause}
    WHERE id = $${newValues.length + 1};
    `;
    await this.dataSource.query(updateQuery, [...newValues, id]);
  }
}
