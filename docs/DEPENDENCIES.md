# Dependencies

## Frontend (`package.json` root)

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.0.1 | UI framework |
| `react-dom` | ^19.0.1 | DOM renderer |
| `@vitejs/plugin-react` | ^5.0.4 | Vite React plugin |
| `vite` | ^6.2.3 | Build tool and dev server |
| `@tailwindcss/vite` | ^4.1.14 | Tailwind CSS v4 Vite plugin |
| `tailwindcss` | ^4.1.14 | Utility-first CSS framework |
| `motion` | ^12.23.24 | Animation library (Framer Motion) |
| `lucide-react` | ^0.546.0 | Icon library |
| `@google/genai` | ^2.4.0 | Google AI SDK (UNUSED in app code) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.8.2 | TypeScript compiler |
| `@types/react` | ^19.2.17 | React type definitions |
| `@types/react-dom` | ^19.2.3 | ReactDOM type definitions |
| `@types/node` | ^22.14.0 | Node.js type definitions |

## Backend (`backend/package.json`)

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/core` | ^11 | NestJS core |
| `@nestjs/common` | ^11 | NestJS common utilities |
| `@nestjs/platform-express` | ^11 | Express adapter |
| `@nestjs/graphql` | ^11 | GraphQL module |
| `@nestjs/apollo` | ^11 | Apollo driver |
| `@nestjs/passport` | ^11 | Passport authentication |
| `@nestjs/jwt` | ^11 | JWT module |
| `@apollo/server` | ^4 | Apollo GraphQL server |
| `graphql` | ^16 | GraphQL engine |
| `@prisma/client` | ^6 | Prisma ORM client |
| `prisma` | ^6 | Prisma CLI |
| `passport` | ^0.7 | Passport authentication |
| `passport-jwt` | ^4.0 | JWT strategy for Passport |
| `bcryptjs` | ^2.4 | Password hashing |
| `class-validator` | ^0.14 | Decorator-based validation (NOT yet used) |
| `class-transformer` | ^0.5 | Class transformation (NOT yet used) |
| `pg` | ^8 | PostgreSQL driver |
| `reflect-metadata` | ^0.2 | Decorator metadata |
| `rxjs` | ^7 | Reactive extensions |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/cli` | ^11 | NestJS CLI |
| `@nestjs/testing` | ^11 | NestJS testing utilities |
| `@types/bcryptjs` | ^2.4 | bcryptjs type definitions |
| `@types/express` | ^5 | Express type definitions |
| `@types/node` | ^22 | Node.js type definitions |
| `@types/passport-jwt` | ^4 | passport-jwt type definitions |
| `typescript` | ^5.8 | TypeScript compiler |
| `ts-node` | ^10 | TypeScript execution |
| `ts-loader` | ^9 | TypeScript webpack loader |
| `source-map-support` | ^0.5 | Source map support |
| `@swc/core` | ^1 | Fast SWC compiler |
| `@swc/cli` | ^0.6 | SWC CLI |
| `jest` | ^29 | Test runner |
| `@types/jest` | ^29 | Jest type definitions |
| `ts-jest` | ^29 | Jest TypeScript transformer |
| `supertest` | ^7 | HTTP testing library |
| `@types/supertest` | ^6 | Supertest type definitions |
| `eslint` | ^9 | Linter |
| `@eslint/js` | ^9 | ESLint JavaScript config |
| `typescript-eslint` | ^8 | TypeScript ESLint |
| `eslint-config-prettier` | ^10 | Prettier ESLint config |
| `eslint-plugin-prettier` | ^5 | Prettier ESLint plugin |
| `prettier` | ^3 | Code formatter |

## Infrastructure

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| PostgreSQL | `postgres:16-alpine` | 5432 | Primary database |
| Redis | `redis:7-alpine` | 6379 | Caching (NOT yet used) |

## Dependency Graph

```
react 19 ◄── react-dom 19
  │
  ├── @vitejs/plugin-react ◄── vite 6
  │                              │
  │                              └── @tailwindcss/vite ◄── tailwindcss 4
  │
  ├── motion 12
  │
  └── lucide-react 0.546

NestJS 11
  │
  ├── @nestjs/graphql ◄── @nestjs/apollo ◄── @apollo/server ◄── graphql 16
  │
  ├── @nestjs/passport ◄── passport ◄── passport-jwt
  │
  ├── @nestjs/jwt
  │
  └── @prisma/client ◄── prisma 6 ◄── pg 8 ◄── PostgreSQL 16
```

## Notable Observations

1. **`@google/genai`** (v2.4.0) is installed in the frontend but is NOT imported or used anywhere in the application code. Likely injected by the AI Studio environment.
2. **`class-validator`** and **`class-transformer`** are listed as backend dependencies but their decorators (`@IsString()`, etc.) are NOT applied to any DTO. Validation is entirely absent.
3. **Redis** is defined in `docker-compose.yml` but has zero code integration — no NestJS Redis module, no caching logic.
4. **`src/api/client.ts`** (REST fetch wrapper) is a fully implemented file but is not imported by any component — it's unused dead code.
5. No `react-router-dom` dependency — portal switching is done via conditional rendering.
