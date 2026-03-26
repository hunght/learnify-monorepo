# Learnify Monorepo

This folder is a new monorepo that combines the existing desktop and mobile apps without modifying the original source repositories.

## Structure

- `apps/desktop`: copied from the Electron desktop repo
- `apps/mobile`: copied from the Expo mobile repo
- `packages`: reserved for future shared code

## Dependency strategy

Both apps now live in one repository, but each app keeps its own lockfile and install boundary:

- `apps/desktop` uses its existing `package-lock.json`
- `apps/mobile` uses its existing `package-lock.json`

This keeps the known-good desktop Electron packaging setup intact while still giving you a single repo that contains both apps.

## First-time setup

```bash
cd /Users/owner/source/learnify-tube/apps/learnify-monorepo
npm run desktop:install
npm run mobile:install
```

## Desktop commands

```bash
npm run desktop:type-check
npm run desktop:package
npm run desktop:test:e2e:smoke
npm run desktop:dev
```

## Mobile commands

```bash
npm run mobile:type-check
npm run mobile:start
npm run mobile:start:mobile
npm run mobile:start:tv
npm run mobile:android
```

For EAS or other Expo app-specific commands, run them from `apps/mobile`, because Expo expects build files such as `app.json` to stay at the app root.
