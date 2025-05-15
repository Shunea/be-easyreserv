import * as MailChecker from 'mailchecker';
import { HttpException, HttpStatus } from '@nestjs/common';
import { REGEX_EMAIL_VALIDATION, ERROR_MESSAGES } from '@src/constants';

const BLACKLIST_EMAILS: string[] = [];

function validateEmail(email: string): void {
  try {
    const emailRegex = REGEX_EMAIL_VALIDATION;
    const hasValidSyntax = emailRegex.test(email);
    const isEmailAddressValid = MailChecker.isValid(email);
    const isEmailInBlackList =
      MailChecker.blacklist().includes(email) ||
      BLACKLIST_EMAILS.includes(email);

    if (!hasValidSyntax || !isEmailAddressValid || isEmailInBlackList) {
      throw new HttpException(
        ERROR_MESSAGES.invalidEmailAddress,
        HttpStatus.BAD_REQUEST,
      );
    }
  } catch (error) {
    throw new HttpException(error.message, error.status);
  }
}

export default validateEmail;
