import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export type JwtPayload = {
  sub?: string;
  role?: string;
  [k: string]: any;
};

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health endpoint
  if (req.path === '/health') return next();

  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string') return res.status(401).json({ error: 'missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, SECRET) as JwtPayload;
    // attach to request for handlers
    (req as any).user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

export function signToken(payload: JwtPayload, opts?: jwt.SignOptions) {
  return jwt.sign(payload, SECRET, opts);
}

// Role enforcement middleware factory.
export function requireRole(required: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user || !user.role) return res.status(403).json({ error: 'forbidden' });
    // admin is superuser
    if (user.role === 'admin') return next();
    // allow exact match
    if (user.role === required) return next();
    return res.status(403).json({ error: 'forbidden' });
  };
}
