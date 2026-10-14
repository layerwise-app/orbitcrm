# Orbit CRM

A focused CRM built with React, TypeScript, TanStack Start and Query, Tailwind,
shadcn/ui, Better Auth, and Drizzle on Cloudflare D1.

## Features

- **Overview**: open and weighted pipeline, won revenue with period-over-period
  change, win rate, deals closing this month, and overdue tasks, with a
  30D/90D/12M/All range switch and revenue/stage charts.
- **Pipeline**: drag-and-drop kanban with per-stage counts, totals, and win
  probabilities; a weighted forecast; Won/Lost drop zones with a lost reason;
  owner, company, and close-date filters; and a list layout.
- **Contacts and companies**: sortable tables with status, tag, and company
  filters, plus multi-select bulk tagging, status changes, export, and delete.
- **Record timeline**: notes, logged calls/emails/meetings, activity, and tasks
  in one feed on each record, with shareable `?view=…&record=…` URLs.
- **Tasks**: grouped Overdue, Today, Upcoming, and Done, with quick add.
- **Command palette** (⌘K): jump to any record or view and create records.
- CSV contact import with preview and validation, filtered CSV export, and
  Better Auth password and email OTP flows.

## Data And Access

Signing up creates a private workspace on the first authenticated CRM request.
Every server operation resolves the workspace from the Better Auth session,
scopes reads/writes to its owner, and validates linked records against the same
workspace. Client-supplied workspace IDs are never trusted. Mutations and their
activity entries use transactional D1 batches. Financial values use integer
cents. Date-only fields and dashboard day boundaries use UTC.

The public landing page is at `/`. Anyone can explore a **demo workspace** at
`/demo`, including signed-in users. Demo changes exist only in memory for that
visit and never touch D1. The private CRM is at `/dashboard`, which requires
sign-in. New authenticated workspaces start empty and can load sample data. Both CRM routes retain
`?view=contacts` (or `companies`, `deals`, `tasks`, `activity`) and `&record=<id>`
for navigation and shareable detail links. Signing out returns to the landing page.

The first version deliberately omits email ingestion, attachments, integrations,
multi-currency, and team permissions. Atomic CRM inspired the scope, but no
upstream code was copied; there are no reused upstream MIT notices to preserve.

## CSV Format

Import a UTF-8 CSV up to 2 MB and 500 contacts. The `name` column is required;
`full_name` is also accepted. Optional columns are `email`, `phone`, `role`
(or `job_title`), `company`, `status`, and `tags`. Status is `prospect`,
`customer`, or `partner`; default is `prospect`. Separate tags with semicolons.
Company names must match a company already in the current workspace.

Quoted commas, escaped quotes, multiline fields, and BOMs are supported.
Validation errors identify the failing row. Server validation runs again before
a transactional import. Exports include company names and neutralize spreadsheet
formula prefixes.

## Verification

```bash
pnpm test
pnpm run check-types
pnpm run build
```

Layerwise manages the development server. Do not start or restart it manually.
Runtime diagnostics are in `.layerwise/dev-server.log`.

## Database Migrations

Schema is defined in `src/db/schema.ts`. Generated migration history is in
`drizzle/` and must not be manually edited. The
`deal_owner_lost_reason_note_type` migration adds deal `owner` and
`lost_reason` columns and a note `type` (note, call, email, or meeting).

```bash
pnpm run db:generate
pnpm run db:migrate
```

## Cloudflare Publishing

The existing Cloudflare Vite plugin produces `dist/server/index.js`, a generated
Worker configuration, and `dist/client/` assets. Publish through **Layerwise's
Publish flow**, which supplies the project's production D1 binding and applies
the generated Drizzle migrations. The source `wrangler.jsonc` intentionally uses
`database_id: "local"`; do not deploy that placeholder as a production database.

Production must receive a stable `BETTER_AUTH_SECRET`, the published origin as
`BETTER_AUTH_URL`, and Layerwise's `AUTH_EMAIL_URL`. They belong only in the
Worker environment, never `VITE_*` variables. Email delivery uses the existing
`sendAuthEmail`; without its injected URL, local development logs OTPs. Password
authentication works without an email provider. Do not change providers or
introduce Supabase/PostgreSQL credentials.

For a separately provisioned Cloudflare environment, bind a real production D1,
apply the same generated Drizzle migrations, configure those secrets, then use
the existing `pnpm release` command after `pnpm run build`.
