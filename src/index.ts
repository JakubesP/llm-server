import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { runOllama } from './ollama-worker';

const app = express();
app.use(express.json());

// Auth middleware

const apiKeyAuth = (req: any, res: any, next: any) => {
  const apiKey = req.header('x-api-key');

  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(403).json({ error: 'Invalid x-api-key' });
  }

  next();
};

// Endpoints

app.post('/ask', apiKeyAuth, async (req: any, res: any) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const correlationId = req.query.correlation_id;
  const streaming = req.query.streaming === 'true';
  if (streaming && !correlationId)
    return res.status(400).json({ error: 'Missing correlation id' });

  try {
    const result = await runOllama(prompt, correlationId);
    res.json({ response: result });
  } catch (err) {
    res.status(500).json({ error: err?.toString() });
  }
});

app.listen(process.env.PORT ?? 3000, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
