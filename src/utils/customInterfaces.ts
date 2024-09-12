export interface User {
    id: number;
    name: string;
    phno: string;
}

export interface RequestWUser extends Request {
    user?: User;
}

import { Request } from 'express';



// Now extend the express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}