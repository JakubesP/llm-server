# syntax=docker/dockerfile:1

############################
# Builder
############################
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


############################
# Runtime
############################
FROM node:20-bookworm-slim AS stage-1

WORKDIR /app

ENV NODE_ENV=production
ENV OLLAMA_HOST=0.0.0.0:11434

# System deps + Ollama deps (IMPORTANT: zstd is required by the install script)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    zstd \
  && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -L --retry 5 --retry-delay 3 -o /tmp/ollama_install.sh https://ollama.com/install.sh \
  && chmod +x /tmp/ollama_install.sh \
  && /tmp/ollama_install.sh \
  && rm -f /tmp/ollama_install.sh

# Install production dependencies for your app
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist

# If you have other runtime files (e.g. prisma, public, views), copy them here as needed:
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/public ./public

# Expose: app + ollama
EXPOSE 3000 11434

# Start both processes (simple approach)
CMD ["sh", "-c", "ollama serve & node dist/index.js"]