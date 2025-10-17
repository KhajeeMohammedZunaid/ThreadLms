import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

interface JwtPayload {
  id: string;
  role: 'student' | 'faculty';
  email: string;
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = (req as any).headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth Middleware:', {
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 30) + '...' : 'NO HEADER',
      hasToken: !!token,
      token: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
    });

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    console.log('✅ Token decoded successfully:', { id: decoded.id, email: decoded.email, role: decoded.role });

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('❌ Auth error:', error instanceof Error ? error.message : error);
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: Array<'student' | 'faculty'>) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = (req as any).headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // Token invalid but continue anyway (no user attached)
    next();
  }
};
