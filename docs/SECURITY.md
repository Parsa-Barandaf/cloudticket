# Security

> Current security model, risks, and recommended improvements.

## Authentication

### Implemented

- **JWT-based authentication**: Users register and login via `login` and `register` GraphQL mutations.
- **Password hashing**: Passwords are hashed with bcryptjs (10 salt rounds) before storage.
- **JWT signing**: Tokens are signed using HS256 with a configurable secret (`JWT_SECRET`) and expiry (`JWT_EXPIRATION`, default 7 days).
- **Bearer token injection**: Frontend `gql()` wrapper reads `localStorage.sahab_access_token` and sets `Authorization: Bearer <token>` header.

```
Login → bcrypt.compare → JWT.sign({ sub: userId, email })
  → Token stored in localStorage
  → All subsequent API calls include Bearer token
```

### Missing

| Feature | Status | Risk |
|---------|--------|------|
| Token refresh mechanism | ❌ | Token cannot be rotated; 7-day fixed expiry |
| Token revocation | ❌ | No blacklist; tokens valid until expiry |
| Password reset flow | ❌ | "Forgot password" is UI-only simulation |
| Rate limiting | ❌ | No protection against brute force |
| Account lockout | ❌ | No lockout after failed attempts |

## Authorization (RBAC)

⚠️ **CRITICAL GAP: No role-based access control is implemented.**

- All GraphQL queries and mutations are publicly accessible.
- No `@UseGuards()` decorator appears anywhere in the backend.
- Any user (or unauthenticated visitor) can call any endpoint.
- The `role` field exists on the `User` model but is never checked.

```
Current state:   Anyone → Any query/mutation → Full access
Required state:  User   → Guard checks role   → Authorized access only
```

## Data Protection

### Implemented
- Passwords are hashed (bcrypt, 10 rounds), never stored in plaintext
- JWT secret is configurable via environment variable
- `.env` files are gitignored

### Missing
| Feature | Status |
|---------|--------|
| Input validation (class-validator) | ❌ |
| SQL injection protection | ✅ (Prisma parameterized queries) |
| XSS protection | ⚠️ (React's built-in escaping, but no CSP headers) |
| CSRF protection | ⚠️ (JWT in header mitigates, but no SameSite config) |
| HTTPS enforcement | ❌ (HTTP only) |
| CORS whitelist | ⚠️ (Only dev ports configured) |
| Helmet.js (security headers) | ❌ |
| Request size limiting | ❌ |

## Token Storage

- JWT is stored in `localStorage` under key `sahab_access_token`.
- This is vulnerable to XSS attacks — any injected script can read the token.
- Alternative (more secure): `httpOnly` cookies would prevent JavaScript access but require backend changes.

## Infrastructure Security

| Concern | Status |
|---------|--------|
| Database accessible only via Docker internal network | ⚠️ (Exposed on port 5432 to host) |
| Redis requires authentication | ❌ (No password configured) |
| PostgreSQL default credentials | ⚠️ (`sahab/sahab_secret`) |
| Docker containers run as root | Unknown |

## Secrets Management

| Secret | Where | Protected? |
|--------|-------|------------|
| `JWT_SECRET` | `backend/.env` + hardcoded fallback | ⚠️ (Hardcoded fallback: `sahab-jwt-secret`) |
| `DATABASE_URL` | `backend/.env` | ✅ (In gitignore) |
| `GEMINI_API_KEY` | Not used in app code | N/A |
| `POSTGRES_PASSWORD` | `docker-compose.yml` | ⚠️ (Plaintext in compose file) |

## Security Checklist

### Required Before Production

- [ ] Implement RBAC guards on all queries/mutations
- [ ] Add input validation decorators to all DTOs
- [ ] Replace hardcoded JWT secret fallback with environment-only config
- [ ] Add rate limiting (express-rate-limit or NestJS throttle)
- [ ] Add Helmet security headers
- [ ] Configure CORS for production origins
- [ ] Add HTTPS termination (reverse proxy or direct)
- [ ] Add request size limiting
- [ ] Implement token refresh mechanism
- [ ] Add account lockout after failed login attempts

### Recommended

- [ ] Move JWT from localStorage to httpOnly cookie
- [ ] Add CSRF protection
- [ ] Add Content Security Policy headers
- [ ] Set Redis password in Docker Compose
- [ ] Change default PostgreSQL credentials
- [ ] Add audit logging for security events
- [ ] Add security.txt and/or disclosure policy
- [ ] Regular dependency audits (`npm audit`)
