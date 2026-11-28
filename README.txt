Majumder Group MIS
IT MTO 48-Hour Take-Home Assessment
=====================================

Candidate : Md Nayeem Miah
Position  : Management Trainee Officer (MTO) – IT Department
Submitted : November 28, 2026

A lightweight, responsive enterprise Management Information System (MIS) that
tracks hourly sewing-line efficiency against style SMV and enforces
conflict-free staff transport dispatch.

Live Demo
---------
  Frontend : https://majumdergroup-mls.vercel.app
  Backend  : https://majumder-group-mls-api.vercel.app
  GitHub   : https://github.com/nayeem-miah/Majumder-Group-MIS

Demo login: admin@gmail.com / 123456

Stack: Next.js 15 (React + TypeScript + Tailwind CSS) frontend,
Node.js + Express + TypeScript backend, Supabase PostgreSQL (relational SQL).


1. Runtime versions
-------------------
- Node.js 18 or newer (developed on Node.js 24)
- npm 9 or newer
- PostgreSQL 15 or newer (or a Supabase PostgreSQL project)


2. Project layout
-----------------
  backend/            Express + TypeScript REST API
  frontend/           Next.js 15 App Router UI
  database.sql        Full database dump: schema + foreign keys + sample data
  csv-tests/          Valid and invalid CSV files for the bulk uploader
  screenshots/        Visual proof of the running system (5 screenshots)
  README.md           Extended documentation with API reference
  README.txt          This quick-start guide


3. Install dependencies
-----------------------
    cd backend  && npm install
    cd frontend && npm install


4. Database setup
-----------------
Create a PostgreSQL database (or use a free Supabase project), then import:

    psql "postgresql://USER:PASSWORD@HOST:5432/DBNAME" -f database.sql

database.sql creates the admins, styles, line_production, vehicles and trips
tables with primary keys, unique keys, foreign keys, check constraints and
updated_at auto-triggers, then inserts pre-populated sample data:

    - 5 styles  (H&M, Zara, Marks & Spencer, Target, Uniqlo)
    - 5 line-production records (including one deliberate bottleneck line)
    - 5 vehicles (one "Under Maintenance")
    - 4 trips   (Scheduled / Dispatched / Completed)

The same schema and seed files are available separately in
  backend/database/schema.sql
  backend/database/seed.sql


5. Environment variables
------------------------
Backend  (backend/.env)  — copy backend/.env.example and fill in:

    PORT=8321
    NODE_ENV=development
    DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
    JWT_ACCESS_SECRET=<any long random string>
    JWT_REFRESH_SECRET=<any long random string>
    JWT_ACCESS_EXPIRES_IN=5d
    JWT_REFRESH_EXPIRES_IN=30d
    JWT_RESET_PASS_SECRET=<any long random string>
    JWT_RESET_PASS_EXPIRES_IN=5m
    ADMIN_EMAIL=admin@gmail.com
    ADMIN_PASSWORD=123456
    CLIENT_URL=http://localhost:3000
    SALT_ROUNDS=12

Frontend (frontend/.env.local) — copy frontend/.env.example:

    NEXT_PUBLIC_API_URL=http://localhost:8321/api

Note: change PORT in both files together if 8321 is already in use.


6. Run the application
----------------------
Terminal 1 (API):

    cd backend
    npm run dev

The first start seeds the admin account from ADMIN_EMAIL/ADMIN_PASSWORD.
API listens on http://localhost:8321/api

Terminal 2 (web UI):

    cd frontend
    npm run dev

Open http://localhost:3000


7. Login credentials
--------------------
    Email:    admin@gmail.com
    Password: 123456

Use the "Demo Login" button for one-click login (reads DEMO_ADMIN_EMAIL /
DEMO_ADMIN_PASSWORD from server env — not embedded in the frontend bundle).


8. Architecture notes
---------------------
Backend
- Modular layered architecture: route → controller → service → pg Pool
- 100% parameterized Raw SQL (no ORM – pg package only)
- Zod request validation and centralised error handler with PostgreSQL error
  code mapping (23505 unique, 23503 FK, 23514 check, 23502 not-null)
- JWT Bearer tokens + HTTP-only refresh cookies
- bcrypt with configurable salt rounds

Business Rules
- Efficiency % = (output_qty × smv) / (operators_present × working_minutes) × 100
- DHU %        = defect_qty / output_qty × 100
- Over-production guard: SELECT FOR UPDATE locks the style row; batch insert
  is rejected if SUM(output_qty) for the style would exceed styles.order_qty
- Trip scheduling: SELECT FOR UPDATE on vehicle; checks capacity, status
  ("Under Maintenance" vehicles are blocked) and time overlap using:
      new_start < existing_end AND new_end > existing_start
- CSV bulk upload: single BEGIN/COMMIT transaction with per-row validation;
  any invalid row rolls the entire batch back; response includes exact CSV
  line numbers and field-level error reasons

Frontend
- Next.js 15 App Router with responsive Tailwind CSS shell
  (desktop sidebar, mobile drawer)
- Dashboard KPI cards: overall weighted factory efficiency & DHU,
  critical bottleneck lines (< 65 %, red highlight + pieces-missing count),
  fleet utilisation %, per-style completion progress bars
- CSV upload screen: inline format guide, downloadable template,
  line/field error table on rollback
- Sonner toasts for all feedback (login, validation, network errors)


9. CSV test files
-----------------
  csv-tests/valid-production.csv        → accepted, inserted atomically
  csv-tests/invalid-defect-quantity.csv → rejects: defect_qty > output_qty
  csv-tests/negative-quantity.csv       → rejects: negative output_qty
  csv-tests/order-limit-exceeded.csv    → rejects: cumulative cap exceeded
  csv-tests/invalid-style.csv           → rejects: unknown style_no
  csv-tests/missing-columns.csv         → rejects: required headers missing

Every invalid file leaves the database unchanged (full rollback).

Required CSV headers:
  prod_date, floor_no, line_no, style_no, operators_present,
  working_minutes, output_qty, defect_qty

prod_date format : YYYY-MM-DD
style_no         : must already exist in the styles table


10. Database tables
-------------------
  admins          System administrators (login credentials)
  styles          Garment styles (buyer, style_no, SMV, order_qty)
  line_production Hourly floor/line production entries
  vehicles        Staff transport fleet registry
  trips           Trip scheduling with time-overlap detection

All tables: BIGINT GENERATED ALWAYS AS IDENTITY PK, TIMESTAMPTZ
created_at / updated_at with auto-update triggers.


11. API endpoints (base: http://localhost:8321/api)
---------------------------------------------------
POST   /auth/login                   Login → access + refresh JWT
GET    /auth/me                      Authenticated admin profile

POST   /styles                       Create style
GET    /styles                       List (search, filter, paginate)
GET    /styles/:id                   Style detail + production totals
PATCH  /styles/:id                   Update style
DELETE /styles/:id                   Safe delete

POST   /production                   Create hourly entry
GET    /production                   List (filter by date/floor/line/style)
PATCH  /production/:id               Update entry
DELETE /production/:id               Delete entry
GET    /production/summary           Aggregated efficiency metrics
POST   /production/bulk-upload       Atomic CSV import (multipart/form-data)

POST   /vehicles                     Register vehicle
GET    /vehicles                     List fleet
PATCH  /vehicles/:id                 Update vehicle
PATCH  /vehicles/:id/status          Change status (Active / Under Maintenance)
DELETE /vehicles/:id                 Delete (blocked if trips exist)

POST   /trips                        Schedule trip
GET    /trips                        List (filter by status)
PATCH  /trips/:id/dispatch           Scheduled → Dispatched
PATCH  /trips/:id/complete           Dispatched → Completed
PATCH  /trips/:id/cancel             Cancel trip

GET    /dashboard/summary            Live KPIs


12. Production build
--------------------
    cd backend  && npm run build    # tsc → dist/
    cd frontend && npm run build    # Next.js standalone

Vercel deployment: each sub-project deploys as a separate Vercel project.
See README.md for full Vercel environment variable reference.
