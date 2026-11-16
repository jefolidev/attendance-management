# api

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.4.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Web Push notifications

The API sends scheduled time clock reminders and test notifications through Web Push. Configure and keep the same VAPID credentials across restarts and deployments:

```env
WEB_PUSH_VAPID_PUBLIC_KEY=<public VAPID key>
WEB_PUSH_VAPID_PRIVATE_KEY=<private VAPID key>
WEB_PUSH_VAPID_SUBJECT=mailto:notifications@example.com
```

Generate a key pair with `bunx web-push generate-vapid-keys --json`. Keep the private key only in the API environment; the public key is returned to the browser for subscription setup. The user must allow notifications in a secure browser context (HTTPS, or localhost for development). The API process must remain running to check schedules and send reminders.

Apply the Prisma migration before starting the updated API:

```bash
bun run prisma:migrate
```
