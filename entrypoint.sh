#!/bin/bash

ollama serve &

sleep 3

if ! ollama list | grep -q "$OLLAMA_MODEL"; then
  ollama pull "$OLLAMA_MODEL"
fi

node dist/index.js
