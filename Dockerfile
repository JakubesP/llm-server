# --- Build TypeScript ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Final image from Node + Ollama ---
FROM node:20-slim
WORKDIR /app

# Install Ollama
RUN apt-get update && apt-get install -y curl ca-certificates && \
    curl -fsSL https://ollama.com/install.sh | sh && \
    rm -rf /var/lib/apt/lists/*

# Copy build files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports
EXPOSE 3000 11434

# Default model (can be overridden at runtime)
ENV OLLAMA_MODEL=qwen3:30b

# Start via entrypoint
CMD ["/entrypoint.sh"]
