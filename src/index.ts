import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config';
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

server.listen(config.port, () => {
  console.log(`[inv-exp] listening on http://localhost:${config.port}`);
});
