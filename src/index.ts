import http from 'http';
import express from 'express';
import cors from 'cors';
import { config, redisLogTarget } from './config';
import { attachSocketServer } from './socket';

const app = express();
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'inv-exp' });
});

const server = http.createServer(app);
attachSocketServer(server);

console.log(`[inv-exp] Redis mode: ${config.redis.mode} (${redisLogTarget(config.redis.url)})`);

server.listen(config.port, config.host, () => {
  console.log(`[inv-exp] listening on ${config.host}:${config.port}`);
});
