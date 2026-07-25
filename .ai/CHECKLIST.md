# Verification Checklist

> Run these checks to verify project health and task completion.

## Pre-Commit Checklist

- [ ] `npm run lint` (`tsc --noEmit`) passes with 0 errors
- [ ] `npm run build` (`vite build`) succeeds
- [ ] No console errors in browser (F12)
- [ ] All modified files reviewed

## Backend Verification

- [ ] `cd backend && npm run build` succeeds
- [ ] `cd backend && npm run test` passes
- [ ] `cd backend && npm run start:dev` starts without errors
- [ ] GraphQL Playground accessible at `http://localhost:4000/graphql`

## Frontend-Backend Integration Check

- [ ] Login works with seed credentials
- [ ] Tickets load from API (not mock)
- [ ] Products load from API (not mock)
- [ ] Customers load from API (not mock)
- [ ] Create ticket mutation succeeds (all 3 portals)
- [ ] Update ticket status mutation succeeds

## Before Creating New Files

- [ ] Could this be accomplished by modifying an existing file? (Prefer editing)
- [ ] Is this file strictly necessary? (Avoid creating unnecessary files)

## Security Checklist

- [ ] No secrets/hardcoded credentials committed
- [ ] No console.log of sensitive data
- [ ] No eval() or dangerous functions
- [ ] Input validation present (for new endpoints)

## Documentation Checklist

- [ ] `docs/CHANGELOG.md` updated for significant changes
- [ ] `docs/SESSION.md` updated for session log
- [ ] `.ai/CURRENT_STATE.md` updated
- [ ] `docs/TASKS.md` updated (completed tasks marked, new tasks added)

## Production Readiness

- [ ] All environment variables documented in `.env.example`
- [ ] No `console.log` statements in production code
- [ ] Error boundaries in place for all portal views
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] All API errors handled gracefully
