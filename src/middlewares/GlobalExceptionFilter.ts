import {
  Catch,
  ExceptionFilter,
  HttpException,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '@src/constants';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, data } = this.parseException(exception);

    response.status(statusCode).json({ statusCode, message, ...data });
  }

  private parseException(exception: any) {
    let statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error.';
    let data: Record<string, any> = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus() ?? HttpStatus.BAD_REQUEST;
      message = exception.message;

      if (exception.message === ERROR_MESSAGES.pleaseVerifyYourEmail) {
        data = { isVerified: false };
      }

      if (
        [
          ERROR_MESSAGES.planTrialPeriodExpired,
          ERROR_MESSAGES.planExpired,
        ].includes(exception.message)
      ) {
        data = { planExpired: true };
      }
    }

    return { statusCode, message, data };
  }
}
