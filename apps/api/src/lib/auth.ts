import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? '';

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

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Throws a 401 error if the token is missing or invalid.
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
