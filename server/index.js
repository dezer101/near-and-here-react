import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { createServer as createViteServer } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const app = express();
const port = Number(process.env.PORT || 3001);
const clients = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

app.use(express.json({ limit: '12kb' }));

app.get('/api/health', (_request, response) => response.json({ ok: true }));

app.post('/api/chat', async (request, response) => {
  const now = Date.now();
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  const state = clients.get(ip) || { count: 0, expiresAt: now + WINDOW_MS };
  if (state.expiresAt <= now) {
    state.count = 0;
    state.expiresAt = now + WINDOW_MS;
  }
  state.count += 1;
  clients.set(ip, state);
  if (state.count > MAX_REQUESTS)
    return response.status(429).json({
      error: 'A short pause before the next question helps keep the travel helper available.',
    });

  if (!process.env.OPENAI_API_KEY)
    return response.status(503).json({
      error: 'The travel helper needs an OpenAI API key in .env.local before it can answer.',
    });
  const messages = request.body?.messages;
  const context = request.body?.context;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 8)
    return response.status(400).json({ error: 'Please send up to eight messages.' });
  const cleanMessages = messages.map((message) => ({
    role: message?.role,
    content: typeof message?.content === 'string' ? message.content.slice(0, 700) : '',
  }));
  if (
    cleanMessages.some(
      (message) => !['user', 'assistant'].includes(message.role) || !message.content,
    )
  )
    return response
      .status(400)
      .json({ error: 'That message could not be read. Please try again.' });
  const placeName =
    typeof context?.place === 'string' ? context.place.slice(0, 160) : 'the selected destination';
  const coordinates =
    Number.isFinite(context?.latitude) && Number.isFinite(context?.longitude)
      ? `The selected map point is ${context.latitude.toFixed(3)}, ${context.longitude.toFixed(3)}.`
      : '';

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const answer = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      instructions: `You are Near & Here’s concise, thoughtful travel companion. The visitor is exploring ${placeName}. ${coordinates} Offer useful, grounded ideas for food, sightseeing and trip planning. Be honest when you are unsure, avoid inventing current opening hours, prices, safety conditions or availability, and encourage checking current local sources for time-sensitive details. Never claim to have booked anything. Keep answers warm and brief, usually under 120 words.`,
      input: cleanMessages,
      store: false,
      max_output_tokens: 280,
    });
    const reply = answer.output_text?.trim();
    if (!reply)
      return response
        .status(502)
        .json({ error: 'The travel helper did not return a reply. Try once more.' });
    return response.json({ reply });
  } catch (error) {
    console.error('Travel assistant request failed:', error.status || error.message);
    return response.status(502).json({
      error: 'The travel helper could not answer just now. Please try again in a moment.',
    });
  }
});

if (process.env.NODE_ENV === 'production' && existsSync(resolve('dist/index.html'))) {
  app.use(express.static(resolve('dist')));
  app.get('*splat', (_request, response) => response.sendFile(resolve('dist/index.html')));
} else if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    configLoader: 'runner',
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () =>
  console.log('Near & Here listening on http://' + host + ':' + port),
);
