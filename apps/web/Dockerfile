# Cipher Clash — Web (Vite dev server)
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy workspace manifests first (layer-cache friendly)
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install all workspace deps
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

EXPOSE 5173

# Start the Vite dev server (host:true is set in vite.config.ts so it binds to 0.0.0.0)
CMD ["pnpm", "--filter", "@cypher-crash/web", "dev"]
