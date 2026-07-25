# Deployment

> How to build, run, and deploy the Sahab CRM platform.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | LTS recommended |
| Docker | 24+ | For PostgreSQL and Redis |
| Docker Compose | 2.x | For service orchestration |
| npm | 10+ | Package manager |

## Local Development

### 1. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`

### 2. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

The seed script populates the database with demo data (6 users, 1 customer, 4 products, 5 tickets).

### 3. Start Backend

```bash
cd backend
npm run start:dev
```

Runs on `http://localhost:4000/graphql` with hot-reload.

GraphQL Playground available at `http://localhost:4000/graphql`.

### 4. Start Frontend

```bash
# From project root
npm run dev
```

Runs on `http://localhost:3000` with HMR.

## Environment Variables

### Frontend (`src/`)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `VITE_API_URL` | `http://localhost:4000/graphql` | No | Backend GraphQL endpoint |

Set via `.env` file at project root or injected at runtime.

### Backend (`backend/`)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | — | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | `sahab-jwt-secret` | No | Secret key for JWT signing |
| `JWT_EXPIRATION` | `7d` | No | JWT token expiry duration |
| `PORT` | `4000` | No | Backend server port |

Set via `backend/.env` file.

### Docker Compose

| Service | Env Variables | Default |
|---------|--------------|---------|
| PostgreSQL | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `sahab_crm`, `sahab`, `sahab_secret` |

## Production Build

### Frontend

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview production build
```

### Backend

```bash
cd backend
npm run build    # Outputs to dist/
npm run start    # Start production server
```

## Full-Stack Run (Local)

```bash
# Terminal 1: Infrastructure
docker compose up -d

# Terminal 2: Database
cd backend
npx prisma migrate dev --name init
npm run seed

# Terminal 3: Backend
cd backend
npm run start:dev

# Terminal 4: Frontend
npm run dev
```

## CORS Configuration

The backend allows requests from:
- `http://localhost:3000` (Vite dev server)
- `http://localhost:5173` (Vite alternate port)

Configured in `backend/src/main.ts`.

## Current Limitations

1. **No production Dockerfile**: There is no `Dockerfile` for either frontend or backend. Only development `docker-compose.yml` exists.
2. **No reverse proxy**: No nginx or similar configured for production deployment.
3. **No CI/CD**: No GitHub Actions or similar pipeline configured.
4. **No SSL/TLS**: All endpoints are HTTP only in current configuration.
5. **No health checks**: No `/health` endpoint on backend.
6. **No logging infrastructure**: Backend uses `console.log` only.
