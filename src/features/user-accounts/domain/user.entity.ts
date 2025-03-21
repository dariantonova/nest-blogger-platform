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

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
  })
  login: string;

  @Prop({
    type: String,
    required: true,
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

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.confirmationInfo = {
      confirmationCode: '',
      expirationDate: new Date(),
      isConfirmed: false,
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
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
