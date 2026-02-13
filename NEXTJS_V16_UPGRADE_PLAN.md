# Next.js v16 Upgrade Plan (Do Not Execute Yet)

## Goal
Upgrade this app from Next.js 14.x to 16.x with the smallest safe change set, preserving runtime behavior and Docker production flow.

## Scope
- Upgrade framework/runtime packages only after compatibility validation.
- Keep business logic unchanged unless required by breaking changes.
- Preserve existing API routes and server actions behavior.

## Files To Edit
1. `package.json`
2. `package-lock.json` (auto-generated update)
3. `next.config.js`
4. `tsconfig.json` (only if required by Next 16 tooling checks)
5. `Dockerfile` (if Next 16 introduces runtime/build requirements)
6. `docker-compose.yml` (only if env/runtime contract changes)
7. `src/app/**` files where deprecated APIs are used (only if needed after build/test)

## Planned Steps
1. Baseline and branch safety
- Capture current `npm ls next react react-dom`.
- Run `npm run build` and key tests to baseline current failures.

2. Dependency upgrade
- Update `next` to latest `16.x`.
- Align `react` and `react-dom` to the version required by Next 16.
- Update `eslint-config-next` only if introduced/required.

3. Config migration
- Review Next 16 release notes for removed/renamed options.
- Patch `next.config.js`:
  - Revalidate `experimental.serverActions.allowedOrigins` syntax and behavior.
  - Remove deprecated experimental flags or migrate to stable equivalents.

4. Code-level compatibility pass
- Build and fix hard errors only:
  - server actions invocation rules
  - route handler/runtime changes
  - edge/node runtime API changes
  - metadata/image config breakages
- Keep patches minimal and localized.

5. Container/runtime validation
- Rebuild Docker image with Node 22.
- Verify app startup, `/api/health`, Mongo TLS connectivity (via Tailscale path), and 1Password runtime injection.

6. Regression checks
- Run existing test scripts that are still valid.
- Perform manual smoke checks for purchase flow, license creation, and email delivery path.

## Expected Risk Areas
1. Server actions behavior and serialization constraints.
2. Wallet-related client bundles and webpack/Turbopack compatibility.
3. Deprecated Next config keys in `next.config.js`.
4. Route handler caching defaults and dynamic/static behavior.

## Rollback Plan
1. Revert `package.json` and `package-lock.json` to pre-upgrade commit.
2. Revert `next.config.js` migration changes.
3. Rebuild container from previous known-good image tag.
