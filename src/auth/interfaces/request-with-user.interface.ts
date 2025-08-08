import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: number;
    rol: string;
    iat?: number;
    exp?: number;
  };
}
