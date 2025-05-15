import * as useragent from 'express-useragent';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class DeviceDetection implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    useragent.express()(req, res, () => {});

    const userAgent = req['useragent'];

    req['isMobileDevice'] = userAgent.isMobile;

    next();
  }
}
