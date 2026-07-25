# Prompt Library

> Reusable prompt templates for common development tasks.

## Analyze a File

```
Read the file at [path] and provide:
1. Its purpose in the project
2. Key functions/exports
3. Dependencies it imports
4. Any issues or concerns
```

## Wire a Mutation

```
Wire the [component] [button/action] to call the real [mutation_name] API mutation instead of using mock data.

Steps:
1. Import gql and the mutation query string
2. Create a helper function that calls gql(mutation, variables)
3. Call it alongside the existing setState call
4. Add Persian→English enum mapping if needed
```

## Create a New Hook

```
Create a new hook use[Name] at src/hooks/use[Name].ts that:
1. Uses useState for data, loading, error
2. Uses useCallback for the fetch function
3. Uses useEffect to fetch on mount
4. Calls gql<ResponseType>(QUERY_STRING)
5. Returns { data, loading, error, refetch }
```

## Create Documentation

```
Create documentation for [feature/area] at [path]:
1. Describe what it does
2. List all files involved
3. Document all exports/functions/interfaces
4. Note any known issues
5. Add examples where applicable
```

## Investigate a Bug

```
Investigate the bug where [symptom]:
1. Find the relevant code paths
2. Trace the data flow
3. Identify the root cause
4. Propose a fix (but don't implement without approval)
```

## Sprint Planning

```
Plan the next sprint based on:
1. Current project state (from .ai/CURRENT_STATE.md)
2. Roadmap (from docs/ROADMAP.md)
3. Open tasks (from docs/TASKS.md)
4. Known technical debt

Propose 5-8 tasks with clear scope and acceptance criteria.
```

## Code Review Request

```
Review the changes in [branch/file]:
1. Check for correctness
2. Check for convention compliance
3. Check for security issues
4. Check for TypeScript errors
5. Provide specific feedback with file:line references
```
