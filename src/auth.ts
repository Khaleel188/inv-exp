import jwt from 'jsonwebtoken';
import { config } from './config';

export type AuthUser = {
  userId: string;
  role?: string;
};

type JwtPayload = {
  user_id?: string | number;
  role?: string;
};

export function verifyAccessToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, config.djangoSecret, {
      algorithms: ['HS256'],
    }) as JwtPayload;
    const userId = decoded.user_id;
    if (userId == null) return null;
    return {
      userId: String(userId),
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function orgRoom(organizationId: string): string {
  return `org:${organizationId}`;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}
