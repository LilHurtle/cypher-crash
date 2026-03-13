import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? '';

/**
 * DEV_MODE: set DEV_MODE=true in .env (or docker-compose) to bypass JWT auth
 * for local play-testing. The web app sends `Bearer dev-local-token` which
 * maps to the hardcoded DEV_USER below.
 *
 * ⚠️  NEVER enable this in production.
 */
const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_TOKEN = 'dev-local-token';

export interface SupabaseJwtPayload {
  sub: string;        // user UUID
  email: string;
  aud: string;
  exp: number;
  role: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

/** Hardcoded local developer user — only active when DEV_MODE=true */
export const DEV_USER: SupabaseJwtPayload = {
  sub: 'dev-user-00000000-0000-0000-0000-000000000001',
  email: 'dev@local.test',
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 86400 * 365,
  role: 'authenticated',
  user_metadata: {
    full_name: 'Dev Player',
    avatar_url: undefined,
  },
};

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * In DEV_MODE, accepts the literal token "dev-local-token" without signature
 * verification and returns the hardcoded DEV_USER.
 */
export async function verifyToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<SupabaseJwtPayload> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    throw new Error('Unauthorized');
  }

  const token = authHeader.slice(7);

  // Dev mode: accept the well-known dev token without JWT verification
  if (DEV_MODE && token === DEV_TOKEN) {
    return DEV_USER;
  }

  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
    return payload;
  } catch {
    reply.code(401).send({ error: 'Invalid or expired token' });
    throw new Error('Unauthorized');
  }
}

/**
 * Fastify preHandler that injects the verified user into request.
 * Usage: preHandler: [authenticate]
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const payload = await verifyToken(request, reply);
  (request as FastifyRequest & { user: SupabaseJwtPayload }).user = payload;
}
