import { Request, Response } from 'express';

// Tipos específicos dos controllers
export interface ControllerRequest extends Request {
  body: any;
  params: any;
  query: any;
}

export interface ControllerResponse extends Response {}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}


export interface ApiErrorResponse {
  error: string;
  details?: import('../../shared/types/CommonTypes').ValidationError[];
  timestamp: string;
}

// Tipos para middlewares
export interface MiddlewareFunction {
  (req: ControllerRequest, res: ControllerResponse, next: Function): void | Promise<void>;
}

export interface ErrorHandlerFunction {
  (error: Error, req: ControllerRequest, res: ControllerResponse, next: Function): void;
}
