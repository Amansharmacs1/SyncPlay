import { Request, Response, NextFunction } from 'express';
import { isOriginAllowed } from '../config/cors.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error Middleware]:', err);

  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
