# Social Media Microservice

A Node.js microservice-based backend project with:

- `identity-service`: user registration, token generation, MongoDB/Redis integration, and rate limiting.
- `api-getway`: API gateway service scaffold.

## Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- Redis (ioredis)
- JWT
- Joi validation
- Winston logging

## Project Structure

```text
social-media-microservice/
├─ api-getway/
│  ├─ package.json
│  └─ src/server.js
├─ identity-service/
│  ├─ package.json
│  ├─ .env
│  ├─ src/
│  │  ├─ server.js
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  └─ routes/
│  └─ utils/
└─ README.md
```

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- MongoDB Atlas or local MongoDB instance
- Redis instance

## Installation

Install dependencies per service:

```bash
cd api-getway
npm install

cd ../identity-service
npm install
```

## Environment Variables

Create `identity-service/.env`:

```env
PORT=3001
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster-url>/
JWT_SECRET=your_jwt_secret
NODE_ENV=development
REDIS_URL=redis://localhost:6379
DNS_SERVERS=8.8.8.8,1.1.1.1
```

Notes:

- `DNS_SERVERS` is optional, but can help if your machine fails SRV DNS lookups for MongoDB Atlas.
- Keep `.env` files out of version control.

## Running Services

Identity service:

```bash
cd identity-service
npm run dev
```

or:

```bash
cd identity-service
npm start
```

API gateway (scaffold):

```bash
cd api-getway
npm run dev
```

## API (Current)

Base URL (identity service): `http://localhost:3001`

### Register User

- Method: `POST`
- Route: `/api/auth/register`
- Body:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "secret123"
}
```

- Success: `201 Created`
- Validation error: `400 Bad Request`
- Rate limit exceeded: `429 Too Many Requests`

## Rate Limiting

Identity service uses two layers:

- Global limiter via Redis (`rate-limiter-flexible`): 10 requests per second per IP.
- Sensitive route limiter (`express-rate-limit` + Redis store): 5 requests per minute for registration.

## Logging

Winston logger is configured with:

- Console logs
- `identity-service/logs/error.log`
- `identity-service/logs/combined.log`

## Current Status

- `identity-service` has active server and route wiring.
- `api-getway/src/server.js` is currently empty (scaffold only).

