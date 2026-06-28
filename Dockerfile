FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma generate / next build only need the schema to be syntactically
# valid — they never connect to this. The real DATABASE_URL is supplied at
# runtime by Railway. (Routes that query the DB, e.g. sitemap.ts, are
# force-dynamic so next build doesn't try to hit the database either.)
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/src ./src
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
