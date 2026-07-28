# Rapor Karakter

A monorepo for building and delivering interactive student report cards — with visual drag-and-drop report templates, SurveyJS-based form creation, and a student-facing runner.

---

## Project Structure

```
rapor-karakter/
├── builder/
│   └── rapor-karakter-builder/   # Admin tool — create forms & design report templates
├── runner/
│   └── rapor-karakter-runner/    # Student-facing app — fill forms, view reports
└── shared/
    ├── forms/
    │   └── configs/<formId>/     # SurveyJS JSON configs saved by builder
    └── reports/
        ├── components/
        │   └── puck.config.ts    # Shared Puck block schema (fields + defaultProps)
        └── configs/<reportId>/   # Puck JSON saved by builder, rendered by runner
```

---

## Apps

### Builder — `localhost:3000`
The admin-facing editor. Runs **locally only** — not deployed. Teachers use this to:
- Design report card templates with drag-and-drop blocks (`/reportCreator`)
- Create SurveyJS questionnaire forms (`/formCreator`)

**Stack:** TanStack Start · React 19 · Puck Editor · SurveyJS Creator · Tailwind CSS v4 · Biome

### Runner — `localhost:3000`
The student/parent-facing viewer. Used to:
- Fill out forms tied to a student (`/form/:formId`)
- View rendered report cards (`/report/:reportId`)

**Stack:** TanStack Start · React 19 · Puck Render · SurveyJS · Drizzle ORM · PostgreSQL · Sentry · Tailwind CSS v4

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- PostgreSQL (for the runner)

### 1. Install dependencies

```bash
# Builder
cd builder/rapor-karakter-builder
npm install

# Runner
cd runner/rapor-karakter-runner
npm install
```

### 2. Configure environment

Copy and fill in the runner's environment file:

```bash
cd runner/rapor-karakter-runner
cp .env.example .env.local
```

Required variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/rapor_karakter
```

### 3. Run database migrations

```bash
cd runner/rapor-karakter-runner
npm run db:push
```

### 4. Start dev servers

```bash
# In one terminal — Builder
cd builder/rapor-karakter-builder
npm run dev        # → http://localhost:3000

# In another terminal — Runner
cd runner/rapor-karakter-runner
npm run dev        # → http://localhost:3000
```

> **Note:** Both apps run on port 3000 by default. Run them in separate terminals or change one port.

---

## How It Works

### Report Templates (Puck)
1. In the **Builder**, go to `/reportCreator` → select a report ID
2. The Puck drag-and-drop editor opens with 4 block types: `HeadingBlock`, `TextBlock`, `TableBlock`, `ImageBlock`
3. Click **Publish** — the layout JSON is saved to `shared/reports/configs/<reportId>/index.json`
4. In the **Runner**, navigate to `/report/<reportId>` — Puck renders the saved layout

### Form Creation (SurveyJS)
1. In the **Builder**, go to `/formCreator`
2. Design the questionnaire using the SurveyJS Creator UI
3. The form config is saved to `shared/forms/configs/<formId>/`
4. In the **Runner**, navigate to `/form/<formId>` — students fill out the form

---

## Key Scripts

| App     | Command            | Description                         |
|---------|--------------------|-------------------------------------|
| Builder | `npm run dev`      | Start dev server                    |
| Builder | `npm run build`    | Production build                    |
| Builder | `npm run check`    | Biome lint + format check           |
| Runner  | `npm run dev`      | Start dev server (loads `.env.local`) |
| Runner  | `npm run build`    | Production build                    |
| Runner  | `npm run db:push`  | Push schema to DB (dev)             |
| Runner  | `npm run db:studio`| Open Drizzle Studio                 |

---

## Contributing

1. Branch from `main`
2. Changes to `shared/` affect both apps — test both before committing
3. Run `npm run check` in the changed app before pushing

---

## Data Flow & Chaining

```
[Builder] Design form  →  shared/forms/configs/<formId>/
[Builder] Design report →  shared/reports/configs/<reportId>/

[Runner] Student opens /form/<formId>
       → fills out SurveyJS form
       → submits → saved to PostgreSQL (answers as JSONB snapshot)
       → redirected to /report/<reportId>?sub=<submissionId>

[Runner] Report page reads ?sub=<submissionId>
       → fetches answers from DB
       → injects data into Puck DataFieldBlocks
       → student sees their personalized report

[Fallback] Report also accepts raw URL params:
       /report/<reportId>?name=Ali&grade=5A&class=5A
       (useful for sharing without a form submission)
```

Forms and reports can be **chained in a wizard sequence**:  
`form-A → report-B → form-C → report-D → ...`
