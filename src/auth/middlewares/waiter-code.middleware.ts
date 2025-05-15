import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { WaiterCodeService } from '@src/user/services/waiter-code.service';
import { WaiterCodeRequest } from '../interfaces/waiter-code-request.interface';

@Injectable()
export class WaiterCodeMiddleware implements NestMiddleware {
  constructor(private readonly waiterCodeService: WaiterCodeService) {}

  use(req: WaiterCodeRequest, res: Response, next: NextFunction) {
    // Inject the waiterCodeService into the request object
    req.waiterCodeService = this.waiterCodeService;
    next();
  }
} 