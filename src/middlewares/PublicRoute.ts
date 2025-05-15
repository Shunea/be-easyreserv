import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction } from 'express';

dotenv.config();

@Injectable()
export class PublicRoute implements NestMiddleware {
  use(
    request: Request & { user: any },
    response: Response,
    next: NextFunction,
  ) {
    const authorization = request.headers['authorization'];
    const token = authorization
      ? authorization.split(' ')[1] || authorization
      : null;

    if (!token) {
      return next();
    }

    return jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET_KEY,
      async (error, payload) => {
        if (error) {
          throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        }

        request.user = payload;

        return next();
      },
    );
  }
}
