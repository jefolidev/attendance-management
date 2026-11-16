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

## Excel backup and restore

All data can be exported or restored as one `.xlsx` workbook. Use an administrator session for these endpoints:

- `GET /api/admin/data/template` downloads the empty workbook with the required tabs and column headers.
- `GET /api/admin/data/export` downloads all application tables in one workbook.
- `POST /api/admin/data/import` accepts the workbook as a multipart `file` field.

The workbook has one tab per table, including employees, time entries, balances, schedules, justifications, and notification records. Keep the IDs and relationship columns intact. Import validates the whole workbook first, reports the sheet/row for validation errors, then applies all rows in one transaction. It merges by ID and does not delete existing records when rows are absent from the workbook.

Exported workbooks contain password hashes and push notification credentials. Store them securely and restrict access to administrators.
