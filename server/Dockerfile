# -------------------------
# Build stage
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# problems.json is imported at runtime from dist/data; tsc does not copy JSON
COPY src/data ./dist/data

# -------------------------
# Runtime stage
# -------------------------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["sh", "-c", "node dist/index.js & node dist/worker.js"]
