import { CreateUserConfirmationDomainDto } from './dto/create-user-confirmation.domain-dto';
import { add } from 'date-fns';
import { UserConfirmationRowWrap } from '../infrastructure/dto/user-confirmation.row.wrap';

export class UserConfirmationWrap {
  confirmationCode: string | null;
  expirationDate: Date | null;
  isConfirmed: boolean;

  static createInstance(
    dto: CreateUserConfirmationDomainDto,
  ): UserConfirmationWrap {
    const userConfirmation = new UserConfirmationWrap();

    userConfirmation.confirmationCode = dto.confirmationCode;
    userConfirmation.expirationDate = dto.expirationDate;
    userConfirmation.isConfirmed = dto.isConfirmed;

    return userConfirmation;
  }

  static reconstitute(row: UserConfirmationRowWrap): UserConfirmationWrap {
    const userConfirmation = new UserConfirmationWrap();

    userConfirmation.confirmationCode = row.confirmation_code;
    userConfirmation.expirationDate = row.confirmation_expiration_date;
    userConfirmation.isConfirmed = row.is_confirmed;

    return userConfirmation;
  }

  setConfirmationCode(code: string, codeLifetimeInSeconds: number) {
    this.confirmationCode = code;
    this.expirationDate = add(new Date(), {
      seconds: codeLifetimeInSeconds,
    });
  }

  makeConfirmed() {
    this.isConfirmed = true;
  }
}
