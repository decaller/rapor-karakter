# Rapor Karakter — TODO

> Legend: `[ ]` todo · `[/]` in progress · `[x]` done · `[-]` dropped/deferred

---

## 🏗️ Infrastructure

- [x] Init monorepo root git repo at `rapor-karakter/`
- [x] Add root `.gitignore`
- [x] Add root `README.md`
- [x] Add `@shared/*` path alias in both builder and runner tsconfigs
- [ ] Add root-level `package.json` with workspace scripts (e.g. `dev:builder`, `dev:runner`, `dev:all`)
- [ ] Set up GitHub remote and push to origin
- [ ] Add `.env.example` to runner
- [ ] CI/CD: GitHub Actions — lint + type-check on PR

---

## 📝 Builder App

### Form Creator
- [x] Integrate SurveyJS Creator (`/formCreator`)
- [x] Save form JSON to `shared/forms/configs/<formId>/`
- [ ] Route `/formCreator` should list existing form configs and allow creating new ones
- [ ] Give forms a human-readable name/title (not just a folder ID)
- [ ] Delete / duplicate form configs from the listing page

### Report Creator (Puck)
- [x] Integrate Puck editor (`/reportCreator/$reportId`)
- [x] `<Puck>` editor with 4 blocks: `HeadingBlock`, `TextBlock`, `TableBlock`, `ImageBlock`
- [x] Save/load report JSON to/from `shared/reports/configs/<reportId>/index.json`
- [ ] `/reportCreator` listing page — show all report IDs (currently hardcoded to `report1`)
- [ ] Add a "New Report" flow — let user enter a report ID / name
- [ ] Delete / duplicate report configs
- [ ] Add more Puck blocks: `DividerBlock`, `SpacerBlock`, `StudentInfoBlock`
- [ ] Add per-block print/page-break hints for PDF export

### General Builder UX
- [ ] Dashboard (`/dashboard`) — show summary stats (form count, report count)
- [ ] Auth gate — only authenticated admins should access the builder
- [ ] Light/dark theme persistence (currently resets on reload)

---

## 🏃 Runner App

### Form Viewer
- [x] Route `/form/$formId` scaffolded
- [ ] Render SurveyJS form from `shared/forms/configs/<formId>/`
- [ ] Save form responses to PostgreSQL via Drizzle
- [ ] Show completion confirmation / thank-you screen

### Report Viewer
- [x] Route `/report/$reportId` with Puck `<Render>`
- [x] Loads JSON from `shared/reports/configs/<reportId>/index.json`
- [ ] PDF export button (print stylesheet or `react-to-pdf`)
- [ ] Dynamic data injection — replace placeholder blocks with real student data from DB

### Dashboard
- [ ] `/dashboard` — student-facing overview of their forms and report cards
- [ ] Auth — student login (session-based or magic link)

### Database (Drizzle + PostgreSQL)
- [ ] Define schema: `students`, `form_responses`, `report_assignments`
- [ ] Run initial migration
- [ ] Wire up form response saving
- [ ] Wire up student ↔ report assignment

### Infrastructure
- [ ] Fix pre-existing `drizzle.config.ts` type error (`DATABASE_URL` may be `undefined`)
- [ ] Sentry integration test — verify error capture works in dev
- [ ] Production deploy (VPS / Railway / Vercel)

---

## 🔗 Shared

- [x] `shared/reports/components/puck.config.ts` — block field schemas
- [x] Per-app `puck.config.tsx` wrappers with React renderers
- [x] `shared/forms/configs/` — SurveyJS JSON storage
- [x] `shared/reports/configs/` — Puck JSON storage
- [ ] Add a `shared/students/` directory for student metadata JSON (if not using DB)
- [ ] Consider migrating `shared/` JSON storage to PostgreSQL once DB is stable

---

## 🎨 Design & UX Polish

- [ ] Replace builder homepage (`/`) placeholder text with actual product copy
- [ ] Runner homepage — welcoming student landing page
- [ ] Consistent component library across both apps (extract to `shared/ui/`)
- [ ] Mobile responsiveness audit for the runner (report viewer + form)
- [ ] Print stylesheet for report cards

---

## 🔒 Security

- [ ] Builder: protect all routes behind admin auth
- [ ] Runner: students should only see their own reports and forms
- [ ] Validate `reportId` / `formId` path params server-side (prevent path traversal)
- [ ] Add rate limiting to server functions

---

## 📦 Future / Nice-to-Have

- [ ] Multi-language support (Bahasa Indonesia primary)
- [ ] Email delivery of report cards (PDF attachment)
- [ ] Bulk report generation (generate PDFs for a whole class)
- [ ] Teacher comments block in report template
- [ ] QR code on report card linking to online version
