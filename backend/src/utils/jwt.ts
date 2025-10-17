import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: 'student' | 'faculty';
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
  const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  } as any);
};

export const verifyToken = (token: string): TokenPayload => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
