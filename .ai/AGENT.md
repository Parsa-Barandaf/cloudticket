# Agent Configuration

> Configuration and context for AI agents working on this project.

## Capabilities

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite 6, Motion, Lucide
- **Backend**: NestJS 11, Apollo GraphQL, Prisma 7, PostgreSQL, JWT
- **Infrastructure**: Docker Compose

## Project Paths

| Context | Path |
|---------|------|
| Frontend root | `D:\Dev\CRM\src\` |
| Backend root | `D:\Dev\CRM\backend\src\` |
| Documentation | `D:\Dev\CRM\docs\` |
| AI context | `D:\Dev\CRM\.ai\` |
| API types | `D:\Dev\CRM\src\api\types.ts` |
| Frontend types | `D:\Dev\CRM\src\types\index.ts` |
| GraphQL schema | `D:\Dev\CRM\backend\src\schema.gql` |
| Prisma schema | `D:\Dev\CRM\backend\prisma\schema.prisma` |
| Seed data | `D:\Dev\CRM\backend\prisma\seed.ts` |

## File Size Warning

The following files are very large and should be read with specific offsets/line ranges rather than in full:

| File | Lines | Strategy |
|------|-------|----------|
| `src/components/portals/DashboardPortal.tsx` | 4,611 | Use grep + specific line ranges |
| `src/components/portals/AgentPortal.tsx` | 2,248 | Use grep + specific line ranges |
| `src/components/portals/UserManagement.tsx` | 1,737 | Use grep + specific line ranges |
| `src/components/portals/TicketDetailsWorkspace.tsx` | 1,237 | Use grep + specific line ranges |
| `src/components/portals/CustomerWorkspace.tsx` | 1,176 | Use grep + specific line ranges |
| `src/components/portals/TicketInbox.tsx` | 1,126 | Use grep + specific line ranges |
| `src/components/portals/NotificationCenter.tsx` | 1,090 | Use grep + specific line ranges |

## Verification Commands

```bash
# Frontend type check
npm run lint

# Frontend build
npm run build
```

## Context Loading Order (New Task)

1. `.ai/CURRENT_STATE.md` — Current state
2. `.ai/MEMORY.md` — Cross-session memory
3. `docs/TASKS.md` — Task list
4. Target file(s) — Specific code

## Response Guidelines

- Provide file:line references when discussing code
- Use Persian terms for UI elements
- Explain bash commands before running them
- Keep responses concise (under 4 lines of prose when possible)
- Never generate or guess URLs
- Never commit changes unless explicitly asked
