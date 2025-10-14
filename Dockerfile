# ---- base ----
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
# lib yang berguna untuk beberapa modul native (kita pakai bcryptjs = murni JS, aman)
RUN apk add --no-cache tini curl

# ---- deps ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# copy source
COPY . .

# ---- runner ----
FROM base AS runner
USER node
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# optional: set timezone (log cron 08:00 WIB biar konsisten)
ENV TZ=Asia/Jakarta

EXPOSE 3001

# Healthcheck: pakai endpoint GET yang kamu punya
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD curl -fsS http://localhost:3001/csrf-token || exit 1

# gunakan tini sebagai PID 1 agar sigterm rapi
ENTRYPOINT ["/sbin/tini","--"]

CMD ["node","server.js"]
