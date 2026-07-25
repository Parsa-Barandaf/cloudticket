# Workflow

> Standard workflows for common development tasks.

## Starting a New Task

1. Read `.ai/CURRENT_STATE.md` to understand current project state
2. Read `.ai/MEMORY.md` for cross-session context
3. Read `docs/TASKS.md` for active/pending tasks
4. Read `docs/ROADMAP.md` for sprint plan
5. Read the specific file(s) you need to modify
6. Create a todo list with the `todowrite` tool
7. Implement changes
8. Run verification commands
9. Update `.ai/CURRENT_STATE.md`
10. Update `docs/SESSION.md`
11. Update `docs/CHANGELOG.md` if significant
12. Mark todos as completed

## Code Modification Workflow

1. **Read first**: Always read the file before editing (`Read` tool or `grep`/`glob` to locate)
2. **Understand conventions**: Check neighboring files for patterns (import style, naming, framework usage)
3. **Edit precisely**: Use the `Edit` tool for exact replacements
4. **Verify**: Run the build/typecheck command to ensure 0 errors
5. **Review**: Check your changes with `Read` to confirm correctness

## Documentation Update Workflow

1. When creating new features, update `docs/CHANGELOG.md`
2. When completing a task, update `docs/TASKS.md` (mark completed)
3. At session end, update:
   - `.ai/CURRENT_STATE.md`
   - `docs/SESSION.md`
4. When making architectural decisions, add to `docs/DECISIONS.md`

## Investigation Workflow

1. Use `Glob` to find files by name pattern
2. Use `Grep` to search file contents
3. Use `Read` to examine specific files
4. Use `Task` (explore subagent) for broad exploration
5. Use `Task` (general subagent) for multi-step research

## Debugging Workflow

1. Reproduce the issue
2. Check browser console for errors
3. Check backend console for errors
4. Trace the data flow: Component → Hook → API → Backend → Database
5. Check the GraphQL response in Network tab
6. Check the Prisma query in backend logs

## Build Verification

Always run after making changes:

```bash
# Frontend type check
npm run lint

# Frontend production build
npm run build
```

## Git Workflow

Only commit when explicitly asked by the user. Never force-push, never create empty commits, never amend commits.
