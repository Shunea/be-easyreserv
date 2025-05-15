import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class InactivateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isInactive = this.reflector.get<boolean>(
      'active',
      context.getHandler(),
    );

    return isInactive === undefined || isInactive === null || !isInactive;
  }
}
