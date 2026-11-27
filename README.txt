Majumder Group - GarmentFlow MIS
IT MTO 48-Hour Take-Home Assessment
===================================

A lightweight, responsive enterprise MIS portal that tracks hourly sewing-line
efficiency against style SMV and enforces conflict-free staff transport
dispatch.

Stack: Next.js 14 (React + TypeScript + Tailwind CSS) frontend,
Node.js + Express + TypeScript backend, PostgreSQL (relational SQL) database.


1. Runtime versions
-------------------
- Node.js 18 or newer (developed on Node.js 24)
- npm 9 or newer
- PostgreSQL 15 or newer (or a Supabase PostgreSQL project)


2. Project layout
-----------------
backend/            Express + TypeScript REST API
frontend/           Next.js 14 App Router UI
database.sql        Full database dump: schema + foreign keys + sample data
csv-tests/          Valid and invalid CSV files for the bulk uploader
screenshots/        Visual proof of the running system
README.md           Extended documentation
README.txt          This quick-start guide


3. Install dependencies
-----------------------
    cd backend  && npm install
    cd frontend && npm install


4. Database setup
-----------------
Create a PostgreSQL database, then import the bundled dump:

    psql "postgresql://USER:PASSWORD@HOST:5432/DBNAME" -f database.sql

database.sql creates the admins, styles, line_production, vehicles and trips
tables with primary keys, unique keys, foreign keys, check constraints and
updated_at triggers, then inserts pre-populated sample data:

    - 5 styles (H&M, Zara, Marks & Spencer, Target, Uniqlo)
    - 5 line-production records (including one deliberate bottleneck line)
    - 5 vehicles (one "Under Maintenance")
    - 4 trips (Scheduled / Dispatched / Completed)

The same schema and seed files are available separately in
backend/database/schema.sql and backend/database/seed.sql.


5. Environment variables
------------------------
Backend (backend/.env) - copy backend/.env.example and fill in:

    PORT=5000
    NODE_ENV=development
    DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
    JWT_ACCESS_SECRET=<any long random string>
    JWT_REFRESH_SECRET=<any long random string>
    ADMIN_EMAIL=admin@gmail.com
    ADMIN_PASSWORD=123456
    CLIENT_URL=http://localhost:3000
    DEMO_ADMIN_EMAIL=admin@gmail.com
    DEMO_ADMIN_PASSWORD=123456

Frontend (frontend/.env.local) - copy frontend/.env.example:

    NEXT_PUBLIC_API_URL=http://localhost:5000/api

Note: change PORT in both files together if 5000 is already in use. The
screenshot environment uses PORT=8321.


6. Run the application
----------------------
Terminal 1 (API):

    cd backend
    npm run dev

The first start seeds the admin account defined by ADMIN_EMAIL/ADMIN_PASSWORD.
On a clean database the API listens on http://localhost:5000/api.

Terminal 2 (web UI):

    cd frontend
    npm run dev

Open http://localhost:3000


7. Login
--------
Use the "Demo Login" button for a one-click real admin login, or sign in with:

    Email:    admin@gmail.com
    Password: 123456

The demo credentials are read only on the server from DEMO_ADMIN_EMAIL /
DEMO_ADMIN_PASSWORD and passed through the normal login service. No password
is embedded in the frontend bundle.


8. Architecture notes
---------------------
Backend
- Layered modules: route -> controller -> service -> PostgreSQL pool.
- Zod request validation and a central error handler.
- Parameterized SQL everywhere (no string interpolation) for injection safety.
- Efficiency % = (output_qty * smv) / (operators_present * working_minutes)
  * 100, rounded to 2 decimals.
- DHU % = defect_qty / output_qty * 100.
- Cumulative over-production: line_production is locked FOR UPDATE and the
  batch insert is rejected if SUM(output_qty) for a style would exceed
  styles.order_qty.
- Trip scheduling: vehicle row is locked FOR UPDATE, then capacity, status and
  overlap checks run inside one transaction. Overlap uses the standard
  predicate: new_start < existing_end AND new_end > existing_start.
  Vehicles marked "Under Maintenance" cannot be dispatched.
- CSV bulk upload: file parsed and validated row by row, then inserted in a
  single BEGIN/COMMIT transaction with FOR UPDATE style locks. Any invalid row
  rolls the whole batch back. API responses include exact CSV line numbers and
  field-level reasons.

Frontend
- App Router with a responsive Tailwind CSS shell (desktop sidebar, mobile
  drawer), shared UI primitives, typed API client.
- Dashboard cards: overall weighted factory efficiency and DHU, critical
  bottleneck lines (< 65%, red with required output / pieces missing), fleet
  utilisation, per-style completion progress bars.
- CSV upload screen shows inline format guidance, a downloadable template with
  a sample row, and a line/field error table on rollback.
- Toasts (Sonner) for login, validation and network feedback.


9. CSV test files
-----------------
    csv-tests/valid-production.csv        accepted, inserted atomically
    csv-tests/invalid-defect-quantity.csv rejects: defect > output
    csv-tests/negative-quantity.csv       rejects: negative output
    csv-tests/order-limit-exceeded.csv    rejects: cumulative cap exceeded
    csv-tests/invalid-style.csv           rejects: unknown style_no
    csv-tests/missing-columns.csv         rejects: missing headers

Every invalid file reports the exact line number and reason, and leaves the
database unchanged.

Required headers:
    prod_date,floor_no,line_no,style_no,operators_present,working_minutes,
    output_qty,defect_qty

prod_date must be YYYY-MM-DD. style_no must already exist in styles.


10. Production build
--------------------
    cd backend  && npm run build
    cd frontend && npm run build

The backend compiles with tsc. The frontend uses Next.js standalone output.
