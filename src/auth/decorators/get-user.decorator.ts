import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  if (!('user' in request)) {
    throw new Error('User not found in request');
  }
  // Type assertion to handle potential unknown type
  return request.user as Record<string, unknown>;
});
