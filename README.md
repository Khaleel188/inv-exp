# inv-exp

Realtime bridge: **Django → Redis → Express (Socket.IO) → React frontend**

## Stack

- Express HTTP server + Socket.IO
- Redis pub/sub (`inv:realtime` channel)
- JWT auth (same `DJANGO_SECRET_KEY` as inv-server)

## Run locally

1. Start Redis (via docker-compose in `inv-server`):

```bash
cd ../inv-server && docker compose up -d redis
```

2. Install and start inv-exp:

```bash
npm install
npm run dev
```

Default port: **4000**

3. Ensure `inv` frontend has:

```
REACT_APP_SOCKET_URL=http://localhost:4000
```

4. Django publishes events when `REALTIME_ENABLED=true` and `REDIS_URL` is set in `inv-server/.env`.

   **Upstash TCP:** paste the connection string from the Upstash console into `REDIS_URL` in both `inv-server/.env` and `inv-exp/.env`:

   ```
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   ```

   inv-exp uses [ioredis](https://upstash.com/docs/redis/howto/connectclient) for pub/sub; inv-server uses redis-py over the same URL.

## Architecture

```
Django (orders, invoices, payments, deliveries)
    ↓ publish
Redis channel: inv:realtime
    ↓ subscribe
inv-exp (Socket.IO)
    ↓ emit org:{organization_id}
React (orders, invoices, deliveries panels auto-refresh)
```

## Socket auth

Clients connect with:

```js
io(SOCKET_URL, {
  auth: {
    token: '<JWT access token>',
    organizationId: '<org uuid>',
  },
});
```

Events received: `realtime:event`
