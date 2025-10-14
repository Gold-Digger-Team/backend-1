# ---- build/run stage ----
FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose port
EXPOSE 3001

# Healthcheck (opsional)
HEALTHCHECK CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3001),res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Run migrations on container start, then start app
CMD npm run db:migrate && node server.js
