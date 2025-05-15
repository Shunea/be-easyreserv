import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WaiterCodeRequest } from '../interfaces/waiter-code-request.interface';

@Injectable()
export class WaiterCodeGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WaiterCodeRequest>();
    const waiterCode = request.headers['x-waiter-code'];

    if (!waiterCode) {
      throw new UnauthorizedException('Waiter code is required');
    }

    try {
      // Verify the waiter code and store the waiter in the request
      const waiter = await request.waiterCodeService.findUserByWaiterCode(waiterCode as string);
      request['waiter'] = waiter;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid waiter code');
    }
  }
} 