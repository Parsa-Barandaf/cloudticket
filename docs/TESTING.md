# Testing

> Current testing infrastructure and strategy.

## Current State

⚠️ **Testing coverage is minimal.** Only the backend has test infrastructure; the frontend has no test framework configured.

## Backend Tests

### Framework

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner (v29) |
| **ts-jest** | TypeScript transformer |
| **supertest** | HTTP assertions |

### Test Files

| File | Type | Status |
|------|------|--------|
| `backend/test/app.e2e-spec.ts` | E2E | 🟡 Minimal (basic supertest smoke test) |

### Running Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Configuration

- E2E config: `backend/test/jest-e2e.json`
- Unit test config: Defined in `backend/package.json` under `jest` key

## Frontend Tests

❌ **No test framework is installed or configured for the frontend.**

| Tool | Status |
|------|--------|
| Jest | ❌ Not installed |
| Vitest | ❌ Not installed |
| React Testing Library | ❌ Not installed |
| Cypress | ❌ Not installed |
| Playwright | ❌ Not installed |

## Verification Commands

These are the available verification commands:

```bash
# Frontend type check (tsc --noEmit)
npm run lint

# Frontend production build
npm run build

# Backend unit tests
cd backend && npm run test

# Backend E2E tests
cd backend && npm run test:e2e
```

## What Should Be Tested

### Priority 1 (Critical)

| Area | Test Type | Notes |
|------|-----------|-------|
| Auth flow (login/register) | E2E | Valid/invalid credentials, JWT generation |
| Create ticket mutation | Integration | All input combinations |
| Update ticket status mutation | Integration | All status transitions |

### Priority 2 (High)

| Area | Test Type | Notes |
|------|-----------|-------|
| Ticket queries | Integration | Filtering, edge cases |
| Product CRUD | Integration | |
| Customer queries | Integration | |
| User queries | Integration | |
| API type transforms | Unit | `mapTicket`, `mapProduct`, `mapCustomer` |

### Priority 3 (Medium)

| Area | Test Type | Notes |
|------|-----------|-------|
| Frontend hooks | Unit | `useAuth`, `useTickets`, etc. |
| Portal login flow | E2E | All 3 portal roles |
| Create ticket flow | E2E | All 3 portals |
| Status change flow | E2E | TicketInbox + Details |
| Error states | Integration | API errors, network failures |

## Testing Gaps

1. **No frontend test framework at all** — every frontend interaction is untested
2. **Backend E2E test is a stub** — only verifies the app boots
3. **No integration tests** for services or resolvers
4. **No unit tests** for any service (auth, tickets, products, customers, users)
5. **No seed data assertions** — seed script runs but is never verified
6. **No API contract tests** — no validation that API responses match frontend expectations
