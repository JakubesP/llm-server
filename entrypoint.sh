#!/bin/bash
set -e

echo "Starting Ollama..."
ollama serve &

# Czekamy AŻ API faktycznie zacznie działać
until curl -s http://127.0.0.1:11434/api/tags >/dev/null; do
  echo "Waiting for Ollama to be ready..."
  sleep 2
done

echo "Ollama is ready."

# Preload modeli
if [ -n "$OLLAMA_MODELS" ]; then
  IFS=',' read -ra MODELS <<< "$OLLAMA_MODELS"
  echo "Preloading models: ${MODELS[@]}"

  for MODEL in "${MODELS[@]}"; do
    if ! ollama list | grep -q "^$MODEL"; then
      echo "Pulling model: $MODEL"
      ollama pull "$MODEL"
    else
      echo "Model already exists: $MODEL"
    fi
  done
fi

echo "Starting Node server..."
node dist/index.js
