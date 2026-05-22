import { Server } from 'socket.io';
import { config, redisLogTarget } from './config';
import { createRedisClient } from './redis';
import { orgRoom, userRoom, verifyAccessToken } from './auth';
import { RealtimeMessage } from './events';

export function attachSocketServer(httpServer: import('http').Server) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = String(socket.handshake.auth?.token || '');
    const organizationId = String(socket.handshake.auth?.organizationId || '');
    const user = verifyAccessToken(token);
    if (!user) {
      next(new Error('Unauthorized'));
      return;
    }
    if (!organizationId) {
      next(new Error('organizationId is required'));
      return;
    }
    socket.data.user = user;
    socket.data.organizationId = organizationId;
    next();
  });

  io.on('connection', (socket) => {
    const orgId = String(socket.data.organizationId);
    const userId = String(socket.data.user.userId);
    socket.join(orgRoom(orgId));
    socket.join(userRoom(userId));

    socket.emit('realtime:connected', {
      organization_id: orgId,
      user_id: userId,
    });
  });

  const subscriber = createRedisClient(config.redisUrl);
  subscriber.on('ready', () => {
    console.log(`[inv-exp] Connected to Redis at ${redisLogTarget(config.redisUrl)}`);
  });
  subscriber.subscribe(config.redisChannel, (err) => {
    if (err) {
      console.error('[inv-exp] Redis subscribe failed', err);
      process.exit(1);
    }
    console.log(`[inv-exp] Subscribed to Redis channel ${config.redisChannel}`);
  });

  subscriber.on('message', (_channel, raw) => {
    let message: RealtimeMessage;
    try {
      message = JSON.parse(raw) as RealtimeMessage;
    } catch {
      console.warn('[inv-exp] Ignoring invalid Redis payload');
      return;
    }
    if (!message.organization_id || !message.event_type) return;
    io.to(orgRoom(message.organization_id)).emit('realtime:event', message);
  });

  subscriber.on('error', (err) => {
    console.error('[inv-exp] Redis error', err);
  });

  return { io, subscriber };
}
