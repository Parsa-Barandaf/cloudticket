# Sprint 1 — Frontend Stabilization & Refactoring

## Status: Complete

### Accomplished

| Area | Change |
|------|--------|
| **Config** | `tsconfig.json`: enabled `strict: true`, fixed `@/*` alias to `./src/*`, added `include: ["src"]` |
| **Config** | `vite.config.ts`: fixed alias from `'.'` to `'src'` |
| **Config** | `package.json`: removed unused deps (`express`, `dotenv`, `autoprefixer`, `esbuild`, `tsx`, `@types/express`) — 90 packages cleaned |
| **Config** | `index.html`: added `lang="fa" dir="rtl"` |
| **Types** | Moved from `src/types.ts` → `src/types/index.ts` — added `Ticket`, `Product`, `Customer`, `ActivityItem`, `NotificationItem`, `Priority`, `TicketStatus` |
| **Lib** | Created `src/lib/utils.ts` — `cn()` classname merger, `formatDate()`, `formatTimeAgo()` |
| **Hooks** | Created `src/hooks/useTheme.ts` — persisted dark mode sync |
| **Hooks** | Created `src/hooks/useLocalStorage.ts` — generic localStorage wrapper |
| **API** | Created `src/api/client.ts` — typed fetch wrapper with get/post/put/delete |
| **UI** | Created `src/components/ui/Button.tsx` — variants (primary/secondary/ghost/danger/outline), sizes, loading state |
| **UI** | Created `src/components/ui/Badge.tsx` — status-colored badges |
| **UI** | Created `src/components/ui/Card.tsx` — with CardHeader/CardTitle sub-components |
| **UI** | Created `src/components/ui/Skeleton.tsx` — loading placeholder + SkeletonRow |
| **UI** | Created `src/components/ui/Toast.tsx` — animated success/error toast |
| **App** | Created `src/components/ErrorBoundary.tsx` — catches render errors, retry button |
| **App** | Refactored `App.tsx` — wraps in ErrorBoundary, uses useTheme hook, imports types from central location |
| **Build** | `npx tsc --noEmit` passes with zero errors |
| **Build** | `npx vite build` succeeds |

### Verified
- `npm run lint` (tsc --noEmit) → 0 errors
- `npx vite build` → builds in ~6s
- All existing UI preserved (login, dashboard, agent portal, customer portal)

### Completed later
- Moved all portal views to `components/portals/` (DashboardPortal, AgentPortal, CustomerPortal, TicketInbox, CustomerWorkspace, UserManagement, NotificationCenter, TicketDetailsWorkspace)
- Backward-compatible re-exports in original file locations (zero import changes needed)

### Remaining (deferred)
- Create shared layout components (Sidebar, Header, PortalLayout) — current inline implementations work; extraction is low priority
- Decompose the 2000+ line `DashboardPortal.tsx` monolith — requires careful regression testing

### How to run
```
npm run dev     # Dev server on port 3000
npm run build   # Production build
npm run lint    # Type check
```
