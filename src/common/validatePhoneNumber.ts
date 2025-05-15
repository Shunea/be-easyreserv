import * as libphonenumber from 'google-libphonenumber';
import gre from '@src/common/globalRegEx';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus } from '@nestjs/common';

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

function getValidatedPhoneNumber(phoneNumber: string): string {
  try {
    const parsedPhoneNumber = phoneUtil.parse(phoneNumber, 'ZZ');
    const isValid = phoneUtil.isValidNumber(parsedPhoneNumber);
    const regionCode = phoneUtil.getRegionCodeForNumber(parsedPhoneNumber);
    const countryCode = phoneUtil.getCountryCodeForRegion(regionCode);

    phoneNumber = phoneNumber.replace(
      gre(`\\+${countryCode}0`),
      `+${countryCode}`,
    );

    if (isValid && regionCode && countryCode) {
      return phoneNumber;
    } else {
      throw new HttpException(
        ERROR_MESSAGES.invalidPhoneNumber,
        HttpStatus.BAD_REQUEST,
      );
    }
  } catch (error) {
    throw new HttpException(error.message, error.status);
  }
}

export default getValidatedPhoneNumber;
