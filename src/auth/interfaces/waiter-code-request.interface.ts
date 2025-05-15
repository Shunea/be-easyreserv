import { Request } from 'express';
import { WaiterCodeService } from '@src/user/services/waiter-code.service';

export interface WaiterCodeRequest extends Request {
  waiterCodeService: WaiterCodeService;
} 