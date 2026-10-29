# Repository Guidelines

## Project Structure & Module Organization

- `api/` contains the Fastify HTTP API, Prisma schema/migrations, infrastructure adapters, controllers, routes, and production entrypoint.
- `ddd/` contains the domain and application layers: entities, value objects, repositories, use cases, and unit tests.
- `web/` is reserved for the frontend; it currently has no source files.
- Keep business rules in `ddd/src/domain` or the corresponding API domain layer. Keep HTTP, database, and cryptography concerns under `api/src/infra`.
- Tests live beside use cases as `*.spec.ts`; reusable fakes and factories are under `test/`.

## Build, Test, and Development Commands

Run commands from the relevant package directory:

```bash
cd api && bun install
cd api && bun run prisma:generate
cd api && bun run prisma:migrate
cd api && bun run start:dev       # Fastify with watch mode
cd api && bun run build           # Compile TypeScript to dist/
cd api && bun run start:prod      # Run the compiled API

cd ddd && bun install
cd ddd && bun test                 # Run Vitest once
cd ddd && bun run test:watch      # Run Vitest interactively
cd ddd && bun run lint            # Apply Biome lint fixes
```

Use Prisma migrations for schema changes; do not edit an already-applied migration.

## Coding Style & Naming Conventions

Use TypeScript with tabs, single quotes, and optional semicolons, following `ddd/biome.json`. Use kebab-case filenames (for example, `register-time-in-entry.ts`), PascalCase for classes, and descriptive camelCase for functions and variables. Organize imports and keep controllers thin by delegating behavior to use cases.

## Testing Guidelines

Vitest is the test framework. Name unit tests after the implementation with `.spec.ts` and cover success, validation, authorization, and domain-rule failures. Run the full `ddd` suite before submitting changes; add or update tests whenever a business rule changes.

## Commit & Pull Request Guidelines

Use concise conventional prefixes consistent with the history: `feat:`, `fix:`, `style:`, or `chore:`. Keep commits focused. Pull requests should explain the behavior change, mention migrations/configuration changes, list validation commands, and include screenshots or API examples when the frontend or HTTP contract changes.

## Security & Configuration

Keep secrets and local configuration in environment files excluded from version control. Never log passwords, JWT secrets, or tokens. Preserve authorization checks in the backend even when adding frontend restrictions.
