import { HttpException, HttpStatus } from '@nestjs/common';

const validators = [
  { regex: /.*[A-Z].*/, message: 'one uppercase letter' },
  { regex: /.*[a-z].*/, message: 'one lowercase letter' },
  { regex: /.*\d.*/, message: 'one digit' },
  { regex: /[@$!%*?&#]/, message: 'one special character' },
  { regex: /.{8,}/, message: '8 characters long' },
];

function validatePassword(password: string) {
  try {
    const failedValidations = validators
      .filter(({ regex }) => !regex.test(password))
      .map(({ message }, index, array) => {
        if (index === 0) {
          return 'at least ' + message;
        } else if (index === array.length - 1) {
          return ' and ' + message;
        } else {
          return ', ' + message;
        }
      });

    if (failedValidations.length > 0) {
      const message = `Password must contain ${failedValidations.join('')}.`;
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    throw new HttpException(error.message, error.status);
  }
}

export default validatePassword;
