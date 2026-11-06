<a href="https://layerwise.app"><picture><source media="(prefers-color-scheme: dark)" srcset="https://layerwise.app/powered-by-dark.png"><img src="https://layerwise.app/powered-by.png" alt="Powered by Layerwise" width="174" height="28"></picture></a>

# Orbit CRM

Orbit is a fast, focused CRM for small sales teams that want their contacts,
pipeline, forecast, and follow-ups in one place without the weight of an
enterprise tool. Visitors can try the full app in a demo workspace with sample
data and no account, or sign up for a private workspace of their own. In it
they can move deals across a drag-and-drop pipeline, see open and weighted
revenue on an overview dashboard, log calls, emails, meetings, and notes on
each record, attach files, manage tasks, and import or export contacts as CSV.

Try the live demo at [orbitcrm.layerwise.site](https://orbitcrm.layerwise.site/).

Orbit was built with [Layerwise](https://layerwise.app), and you can open it in
Layerwise to make your own version.

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
- **Files**: attach files to contacts, companies, and deals from the record's
  Files tab; open, download, or delete them. Uploads go to Layerwise Storage.
- **Tasks**: grouped Overdue, Today, Upcoming, and Done, with quick add.
- **Command palette** (⌘K): jump to any record or view and create records.
- CSV contact import with preview and validation, filtered CSV export, and
  Better Auth password and email OTP flows.

Built with React, TypeScript, TanStack Start and Query, Tailwind CSS,
shadcn/ui, Better Auth, and Drizzle on Cloudflare D1.

## Making It Yours

| What | Where |
| --- | --- |
| Landing page copy (hero, feature sections, closing call to action, footer) | `src/components/landing/` (`hero.tsx`, `features.tsx`, `landing-footer.tsx`) |
| Figures in the landing page's product visuals | `src/components/landing/data.ts` |
| GitHub link in the landing header | `REPO_URL` in `src/components/landing/github-button.tsx` |
| Logo mark and wordmark | `src/components/brand.tsx`; icons in `public/` |
| Page titles and descriptions | the `head` of each route in `src/routes/`, using `seo()` from `src/utils/seo.ts` |
| Colors and theme tokens | `:root` in `src/styles/app.css` (`--vermilion` is the brand hue, `--primary` the button color) |
| App, landing, and auth styles | `src/styles/crm.css`, `src/styles/landing.css`, `src/styles/auth.css` |
| Pipeline stages, stage names, win probabilities, lost reasons, statuses | `src/lib/crm.ts` |
| Demo and "Load sample data" records | `src/lib/crm-demo.ts` |
| Upload size limit | `maxAttachmentBytes` in `src/lib/crm.ts` |
| Database tables | `src/db/schema.ts` |

To add a sample company, contact, deal, or task, add a row to the matching
array in `src/lib/crm-demo.ts` (`companies`, `contacts`, `deals`, `tasks`). A
comment above each array lists its columns, and rows link to each other by ID
(for example a contact's company is `'co-northwind'`). The same rows feed the
`/demo` workspace and the "Load sample data" button in a new workspace.

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

Attachments are stored in Layerwise Storage (`env.STORAGE`, typed in
`src/lib/storage.ts`) under `workspaces/<workspace id>/attachments/<generated id>`.
D1 keeps only the key, file name, size, type, and uploader; open and download
links are short-lived signed URLs created when the Files tab loads. Files are
private and checked against the session's workspace like every other
operation. Deleting a file, a record, or records in bulk also deletes the stored
files. Uploads are limited to 50 MB per file, or the plan's per-file limit if
lower. The local preview and the published app share the same Storage. The
demo keeps no files, so attachments are off there.

The first version deliberately omits email ingestion, integrations,
multi-currency, and team permissions.

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

## Commands

The project uses pnpm.

```bash
pnpm test              # unit tests in tests/
pnpm run check-types   # TypeScript
pnpm run build         # type check and production build
```

Layerwise manages the development server. Do not start or restart it manually.
Runtime diagnostics are in `.layerwise/dev-server.log`.

## Database Migrations

Schema is defined in `src/db/schema.ts`. Generated migration history is in
`drizzle/` and must not be manually edited. The
`deal_owner_lost_reason_note_type` migration adds deal `owner` and
`lost_reason` columns and a note `type` (note, call, email, or meeting). The
`record_attachments` migration adds the `crm_attachments` table.

```bash
pnpm run db:generate
pnpm run db:migrate
```

## Publishing

The Cloudflare Vite plugin produces `dist/server/index.js`, a generated
Worker configuration, and `dist/client/` assets. Publish through **Layerwise's
Publish flow**, which supplies the project's production D1 binding and Storage,
and applies the generated Drizzle migrations. The source `wrangler.jsonc`
intentionally uses `database_id: "local"`; do not deploy that placeholder as a
production database.

Production must receive a stable `BETTER_AUTH_SECRET`, the published origin as
`BETTER_AUTH_URL`, and Layerwise's `AUTH_EMAIL_URL`. They belong only in the
Worker environment, never `VITE_*` variables. Email delivery uses
`sendAuthEmail` in `src/lib/auth-email.ts`; without `AUTH_EMAIL_URL`, it logs
OTPs to the server console. Password authentication works without an email
provider.

For a separately provisioned Cloudflare environment, bind a real production D1,
apply the same generated Drizzle migrations, configure those secrets, then use
the existing `pnpm release` command after `pnpm run build`.
