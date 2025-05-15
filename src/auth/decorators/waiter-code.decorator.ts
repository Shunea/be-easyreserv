import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WaiterCodeService } from '@src/user/services/waiter-code.service';

export const WaiterCode = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const waiterCode = request.headers['x-waiter-code'];

    if (!waiterCode) {
      throw new UnauthorizedException('Waiter code is required');
    }

    // Get the WaiterCodeService from the request object (needs to be set by a middleware)
    const waiterCodeService = request.waiterCodeService;
    if (!waiterCodeService) {
      throw new Error('WaiterCodeService not found in request context');
    }

    try {
      // Replace the user data with waiter data
      const waiter = await waiterCodeService.findUserByWaiterCode(waiterCode);
      return waiter;
    } catch (error) {
      throw new UnauthorizedException('Invalid waiter code');
    }
  },
); 