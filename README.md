# Social Media Microservice

Node.js microservice backend with:

- `identity-service` for authentication flows.
- `api-getway` (API gateway) for request proxying and centralized limits.

## Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- Redis (ioredis)
- JWT
- Joi
- Winston

## Project Structure

```text
social-media-microservice/
|-- api-getway/
|   |-- src/server.js
|   |-- middleware/errorHandler.js
|   |-- utils/logger.js
|   `-- package.json
|-- identity-service/
|   |-- src/server.js
|   |-- src/routes/identitiy-routes.js
|   |-- src/controllers/identity-contorller.js
|   |-- src/models/
|   |-- src/middleware/errorHandler.js
|   |-- utils/
|   `-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18+ (20+ recommended)
- MongoDB Atlas (or local MongoDB)
- Redis

## Installation

```bash
cd api-getway
npm install

cd ../identity-service
npm install
```

## Environment Variables

### identity-service/.env

```env
PORT=3001
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster-url>/
JWT_SECRET=your_jwt_secret
NODE_ENV=development
REDIS_URL=redis://localhost:6379
DNS_SERVERS=8.8.8.8,1.1.1.1
```

### api-getway/.env

```env
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
IDENTITY_SERVICE_URL=http://localhost:3001
```

Notes:

- `DNS_SERVERS` is optional and useful when SRV DNS lookups to MongoDB Atlas fail.
- `.env` files are ignored by `.gitignore`.

## Run

Identity service:

```bash
cd identity-service
npm run dev
```

Gateway:

```bash
cd api-getway
npm run dev
```

## API Routes

Identity service base URL: `http://localhost:3001`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

Gateway base URL: `http://localhost:3000`

- `POST /v1/auth/register` -> proxies to identity service
- `POST /v1/auth/login` -> proxies to identity service
- `POST /v1/auth/refresh-token` -> proxies to identity service
- `POST /v1/auth/logout` -> proxies to identity service

## Validation Rules

Registration payload:

- `username`: string, min 3, max 30
- `email`: valid email
- `password`: string, min 6

Login payload:

- `email`: valid email
- `password`: string, min 6

## Rate Limiting

Identity service:

- Global limiter: `10 requests/second` per IP (`rate-limiter-flexible` + Redis)
- Register route limiter: `5 requests/minute` (`express-rate-limit` + Redis store)

Gateway:

- Global limiter: `100 requests/minute` per IP (`express-rate-limit` + Redis store)

## Logging

Both services use Winston with console + file transports:

- `identity-service/logs/error.log`
- `identity-service/logs/combined.log`
- `api-getway/logs/error.log`
- `api-getway/logs/combined.log`
