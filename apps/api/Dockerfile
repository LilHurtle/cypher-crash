# Cipher Clash — API server
# Runs database schema push + seed + dev server in one container.
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy workspace manifests first (layer-cache friendly)
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all workspace deps
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build shared types so the API can import them
RUN pnpm --filter @cypher-crash/shared build

# Generate Prisma client
RUN pnpm --filter @cypher-crash/api db:generate

EXPOSE 3001

# On container start: push schema → seed words + battle pass → run dev server
CMD ["sh", "-c", \
  "pnpm --filter @cypher-crash/api db:push && \
   pnpm --filter @cypher-crash/api seed && \
   pnpm --filter @cypher-crash/api dev"]
