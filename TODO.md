# Rapor Karakter — TODO

> Legend: `[ ]` todo · `[/]` in progress · `[x]` done · `[-]` dropped/deferred

---

## 🏗️ Infrastructure

- [x] Init monorepo root git repo at `rapor-karakter/`
- [x] Add root `.gitignore`
- [x] Add root `README.md`
- [x] Add `@shared/*` path alias in both builder and runner tsconfigs
- [ ] Add root-level convenience scripts (e.g. `run-builder.sh`, `run-runner.sh`)
- [ ] Set up GitHub remote and push to origin
- [ ] Add `.env.example` to runner (document `DATABASE_URL`, `ADMIN_PASSWORD`)
- [ ] Fix pre-existing `drizzle.config.ts` type error (`DATABASE_URL` may be `undefined`)

---

## 📝 Builder App

> The builder is **offline-only** — runs locally on the teacher's/admin's machine. No auth required. No deployment.

### Dashboard (`/dashboard`) — Page Manager
- [ ] List all forms (`shared/forms/configs/`) and reports (`shared/reports/configs/`) in two sections
- [ ] Each card shows: ID, last modified date
- [ ] Actions per card:
  - [ ] **Open** → navigates to `/formCreator/$formId` or `/reportCreator/$reportId`
  - [ ] **Duplicate** → copies the folder in `shared/` with a new ID (timestamp suffix)
  - [ ] **Delete** → deletes the file/folder from disk (file-only, no DB — simpler, reversible via git)
- [ ] **New Form** button → creates empty `shared/forms/configs/<uuid>/index.json`, navigates to editor
- [ ] **New Report** button → creates empty `shared/reports/configs/<uuid>/index.json`, navigates to editor
- [ ] Forms and Reports use a human-readable `name` field stored in the config JSON (e.g., `{ "name": "Rapor Semester 1", ... }`)

### Form Creator (`/formCreator/$formId`)
- [x] Integrate SurveyJS Creator
- [x] Save form JSON to `shared/forms/configs/<formId>/`
- [ ] Save `name` metadata alongside survey JSON
- [ ] "Back to Dashboard" breadcrumb/button
- [ ] Chain config: set a **next report ID** — after submit the runner redirects to `/report/<reportId>?sub=<submissionId>`

### Report Creator (`/reportCreator/$reportId`)
- [x] Integrate Puck editor (`/reportCreator/$reportId`)
- [x] `<Puck>` editor with 4 blocks: `HeadingBlock`, `TextBlock`, `TableBlock`, `ImageBlock`
- [x] Save/load report JSON to/from `shared/reports/configs/<reportId>/index.json`
- [ ] Save `name` metadata alongside Puck JSON
- [ ] "Back to Dashboard" breadcrumb/button
- [ ] Add more Puck blocks:
  - [ ] `DividerBlock` — horizontal rule
  - [ ] `SpacerBlock` — adjustable vertical gap
  - [ ] `DataFieldBlock` — renders a value from URL query param or submission (e.g. `?name`, `?grade`)
  - [ ] `ConditionalBlock` — show/hide based on a query param value
- [ ] Chain config: set a **next form ID** — report page can have a "Fill next form →" button

---

## 🏃 Runner App

> The runner is deployed publicly. Two audiences: **students** (fill forms, view reports) and **admin** (view all responses, manage data).

### Student Flow

#### Form (`/form/$formId`)
- [ ] Render SurveyJS form from `shared/forms/configs/<formId>/`
- [ ] On submit: save response to PostgreSQL (see DB schema below)
- [ ] On submit: redirect to `/report/<nextReportId>?sub=<submissionId>` if a chain is configured

#### Report (`/report/$reportId`)
- [x] Route scaffolded with Puck `<Render>`
- [x] Loads Puck layout JSON from `shared/reports/configs/<reportId>/index.json`
- [ ] Read `?sub=<submissionId>` → fetch that submission's answers from DB → inject into Puck context
- [ ] Read URL query params as fallback data (e.g. `?name=Ali&grade=5A`) when no `sub` provided
- [ ] `DataFieldBlock` reads from injected data context
- [ ] **Print button** → triggers `window.print()` with a clean print stylesheet
- [ ] "Fill next form →" button if a next-form chain is configured on the report

### Admin Area (`/admin/*`)

#### Auth
- [ ] `/admin/login` — simple password form (password set in `ADMIN_PASSWORD` env var)
- [ ] Session cookie stored on success (server-side, HttpOnly)
- [ ] All `/admin/*` routes protected by session check server-side
- [ ] `/admin/logout` clears session

#### Dashboard (`/admin/dashboard`)
- [ ] Submission table: columns — Form Name, Submission ID, Submitted At, (first N answer values)
- [ ] Filter by form ID
- [ ] Search across answer data
- [ ] Pagination
- [ ] Per-row actions:
  - [ ] View full answers
  - [ ] Open linked report (`/report/<id>?sub=<submissionId>`)
  - [ ] Delete submission

#### Export
- [ ] Export all submissions for a form as CSV
- [ ] Export as JSON
- [ ] (Later) Bulk PDF generation via Puppeteer/Playwright

---

## 🗄️ Database (Drizzle + PostgreSQL)

### Schema

```
forms_submissions
  id          uuid  PK  default gen_random_uuid()
  form_id     text  NOT NULL          -- matches shared/forms/configs/<formId>/
  answers     jsonb NOT NULL          -- snapshot of all field values at submit time
  submitted_at timestamptz default now()
```

- [ ] Write Drizzle schema (`src/db/schema.ts`)
- [ ] Run initial migration (`npm run db:push`)
- [ ] Server fn: `saveSubmission(formId, answers)` → returns `submissionId`
- [ ] Server fn: `getSubmission(submissionId)` → returns answers JSON
- [ ] Server fn: `listSubmissions(formId?)` → paginated list for admin dashboard
- [ ] Server fn: `deleteSubmission(id)`
- [ ] Server fn: `exportSubmissions(formId)` → CSV string

### Backup / Portability
- [ ] After each submission also write a JSON file to `shared/forms/responses/<formId>/<submissionId>.json`
- [ ] Git-committed backups are optional but useful for offline restore

---

## 🎨 Design & UX

- [ ] Builder dashboard — card-based grid layout with form/report type badges
- [ ] Runner: print stylesheet for report cards (`@media print`)
- [ ] Runner: mobile-friendly form layout
- [ ] Replace builder and runner homepage placeholder text with real copy
- [ ] Consistent empty states (no forms yet, no reports yet)

---

## 🔒 Security

- [ ] Admin routes: validate session cookie server-side on every request
- [ ] Validate `formId` / `reportId` / `submissionId` path params (no `../` path traversal)
- [ ] Rate-limit form submission server fn (prevent spam)
- [ ] `ADMIN_PASSWORD` must not be committed — add to `.gitignore` / `.env.example`

---

## 📦 Future / Nice-to-Have

- [ ] Multi-language UI (Bahasa Indonesia primary)
- [ ] Email delivery — send report link to student after submission
- [ ] Bulk PDF export for admin (generate PDFs for an entire class via Puppeteer)
- [ ] QR code on report linking back to the online version
- [ ] Form versioning — lock a form version after first response so changing the form doesn't break existing submissions
- [ ] Offline PWA mode for runner (for schools with unreliable internet)
