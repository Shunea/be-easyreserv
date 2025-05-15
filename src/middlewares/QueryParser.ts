import getValidatedPhoneNumber from '@src/common/validatePhoneNumber';
import validateEmail from '@src/common/email/validate/email.validate';
import validatePassword from '@src/common/validatePassword';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, NestMiddleware } from '@nestjs/common';

export interface IFilter {
  all?: string;
  filter?: any;
  limit?: number;
  search?: string;
  skip?: number;
  sortBy?: any;
}

export class QueryParser implements NestMiddleware {
  use(request: any, response: any, next?: () => any): any {
    const {
      sortBy = 'id',
      limit = 10,
      skip = 0,
      order = 'ASC',
      all = false,
      search = null,
      filter = null,
    } = request.query;

    const parsedLimit = parseInt(limit as string, 10);
    const parsedSkip = parseInt(skip as string, 10);
    let parsedFilter = null;

    if (isNaN(parsedLimit) || parsedLimit < 0) {
      throw new HttpException(
        ERROR_MESSAGES.invalidLimitParameter,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isNaN(parsedSkip) || parsedSkip < 0) {
      throw new HttpException(
        ERROR_MESSAGES.invalidSkipParameter,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (filter) {
      try {
        parsedFilter = JSON.parse(filter as string);
        if (Array.isArray(parsedFilter)) {
          throw new HttpException(
            ERROR_MESSAGES.filterMustBeAnObject,
            HttpStatus.BAD_REQUEST,
          );
        }
      } catch (error) {
        throw new HttpException(
          ERROR_MESSAGES.invalidFilterParameter,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const parseRequestBody = () => {
      const { body, query, url } = request;

      if (body?.email) {
        body.email = body.email.toLowerCase().trim();
        validateEmail(body.email);

        const isRegistering = url.includes('/auth/register');
        const isNotFromIshunea = !body.email.endsWith('@ishunea.io');
        const isSuperAdmin = body.isSuperAdmin;

        if (isRegistering && isNotFromIshunea && isSuperAdmin) {
          throw new HttpException(
            ERROR_MESSAGES.registrationUnavailable,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (body?.phoneNumber) {
        body.phoneNumber = getValidatedPhoneNumber(body.phoneNumber);
      }

      if (body?.password) {
        validatePassword(body.password);
      }

      if (query?.email) {
        query.email = query.email.toLowerCase().trim();
        validateEmail(query.email);
      }

      if (query?.phoneNumber) {
        query.phoneNumber = getValidatedPhoneNumber(query.phoneNumber);
      }
    };

    parseRequestBody();

    request.queryParsed = {
      filter: parsedFilter,
      limit: parsedLimit,
      skip: parsedSkip,
      sortBy: { [sortBy]: order },
      all,
      search,
    };

    return next();
  }
}
