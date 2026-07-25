# Project Rules & Conventions

> These rules are derived from the existing codebase and project instructions. They must be followed when contributing.

## Structural Rules

1. **Backend location**: The backend lives inside `backend/` directory. DO NOT move it, rename it, or restructure it.
2. **No refactoring**: DO NOT refactor code, create new architecture, move folders, rename files, or optimize code without explicit instruction.
3. **No new features without approval**: DO NOT write new features or fix bugs unless assigned.
4. **Preserve Persian-first UX**: All UI labels, statuses, priorities, and messages are in Persian. Never introduce English UI strings.

## Code Conventions

### Frontend

| Convention | Standard |
|------------|----------|
| Language | TypeScript (strict mode) |
| Component style | Functional components with hooks |
| CSS framework | Tailwind CSS 4 (via `@tailwindcss/vite`, no config file) |
| Icons | Lucide React |
| Animations | Motion (`motion/react`) |
| RTL | `dir="rtl"` on root, Persian (Vazirmatn) font |
| File naming | PascalCase for components, camelCase for hooks/utils |
| Imports | React first, then libraries, then local modules |
| State management | React hooks + localStorage (no Redux/Zustand) |
| API calls | Via custom hooks → `gql()` function |

### Backend

| Convention | Standard |
|------------|----------|
| Language | TypeScript, decorators enabled |
| Framework | NestJS 11 (controllers → resolvers for GraphQL) |
| API paradigm | GraphQL code-first (Apollo) |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Module structure | `module.ts` + `resolver.ts` + `service.ts` per feature |
| Model definitions | `@ObjectType()` in `common/models/` |
| Input types | `@InputType()` in `common/dto/` |
| Auth | JWT via passport-jwt (Bearer token) |

### Git

| Convention | Standard |
|------------|----------|
| Commits | Only when explicitly requested |
| Commit style | Concise, matching repo conventions |
| No force-push | Never use `--force` |
| No empty commits | Never create empty commits |

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase, `.tsx` | `DashboardPortal.tsx` |
| Hooks | `use` + camelCase, `.ts` | `useTickets.ts` |
| Utilities | camelCase, `.ts` | `utils.ts` |
| API transforms | camelCase, `.ts` | `transform.ts` |
| GraphQL queries | UPPER_SNAKE_CASE | `GET_TICKETS` |
| Types/Interfaces | PascalCase | `ApiTicket`, `Customer` |
| CSS classes | Tailwind utility classes | No custom CSS unless necessary |

## Security Rules

1. **Never commit secrets**. `.env` files are gitignored; only commit `.env.example` with placeholder values.
2. **Never expose JWT secrets** in client-side code.
3. **Never log tokens or passwords** in console or server logs.
4. Auth tokens are stored in `localStorage` — be aware of XSS implications.

## File Size Limits

- Files exceeding 1,000 lines should be considered for decomposition (current offenders: `DashboardPortal.tsx` at 4,611 lines, `AgentPortal.tsx` at 2,248 lines, `UserManagement.tsx` at 1,737 lines).

## Testing

- Run `npm run lint` (`tsc --noEmit`) before committing to check for TypeScript errors.
- Run `npm run build` (`vite build`) to verify production build succeeds.
- Backend: run `npm run test` in `backend/` for NestJS tests.
