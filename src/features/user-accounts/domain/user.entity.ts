import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ConfirmationInfo,
  ConfirmationInfoSchema,
} from './confirmation-info.schema';
import {
  PasswordRecoveryInfo,
  PasswordRecoveryInfoSchema,
} from './password-recovery-info.schema';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { add } from 'date-fns';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
  match: /^[a-zA-Z0-9_-]*$/,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
};

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    ...loginConstraints,
  })
  login: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    ...emailConstraints,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
  })
  passwordHash: string;

  createdAt: Date;
  updatedAt: Date;

  @Prop({
    type: ConfirmationInfoSchema,
  })
  confirmationInfo: ConfirmationInfo;

  @Prop({
    type: PasswordRecoveryInfoSchema,
  })
  passwordRecoveryInfo: PasswordRecoveryInfo;

  @Prop({
    type: Date,
    nullable: true,
    default: null,
  })
  deletedAt: Date | null;

  static createInstance(
    dto: CreateUserDomainDto,
    isConfirmed: boolean,
  ): UserDocument {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.confirmationInfo = {
      confirmationCode: '',
      expirationDate: new Date(),
      isConfirmed,
    };
    user.passwordRecoveryInfo = {
      recoveryCodeHash: '',
      expirationDate: new Date(),
    };
    user.deletedAt = null;

    return user as UserDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('User is already deleted');
    }
    this.deletedAt = new Date();
  }

  setConfirmationCode(code: string, codeLifetimeInSeconds: number) {
    this.confirmationInfo.confirmationCode = code;
    this.confirmationInfo.expirationDate = add(new Date(), {
      seconds: codeLifetimeInSeconds,
    });
  }

  makeConfirmed() {
    this.confirmationInfo.isConfirmed = true;
  }

  setPasswordRecoveryCodeHash(codeHash: string, codeLifetimeInSeconds: number) {
    this.passwordRecoveryInfo.recoveryCodeHash = codeHash;
    this.passwordRecoveryInfo.expirationDate = add(new Date(), {
      seconds: codeLifetimeInSeconds,
    });
  }

  resetPasswordRecoveryInfo() {
    this.passwordRecoveryInfo.recoveryCodeHash = '';
    this.passwordRecoveryInfo.expirationDate = new Date();
  }

  setPasswordHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
