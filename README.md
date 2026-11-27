# GarmentFlow MIS (Apparel Manufacturing & Logistics MIS)

GarmentFlow MIS is a high-performance, enterprise-grade Management Information System built for apparel manufacturers. It provides real-time visibility and control over garment styles, floor and line production efficiency, defect monitoring (DHU), vehicle fleet dispatch, atomic CSV bulk uploads, and an Executive MIS Dashboard.

---

## 🛠 Technology Stack

- **Backend Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **Database:** Supabase PostgreSQL (PostgreSQL 15+)
- **Database Driver:** Native PostgreSQL Client (`pg`) with parameterized Raw SQL
- **Authentication:** JWT (`jsonwebtoken`) with HTTP-only Cookies and Bearer Tokens
- **Password Security:** `bcrypt` (12 salt rounds)
- **Validation:** Zod schemas
- **File Upload:** Multer with strict MIME and extension filtering

> **Strict Architectural Constraint:** 100% Raw SQL queries. Zero ORMs (No Prisma, MongoDB, Mongoose, or TypeORM).

---

## 🚀 System Features

1. **Enterprise Admin Authentication:**
   - Secure login, logout, password reset, and profile (`/auth/me`) retrieval.
   - Idempotent database admin seeder reading from environment variables.
   - Passwords securely hashed with bcrypt; password hashes are never exposed.

2. **Garment Style Management:**
   - Complete CRUD operations for garment styles with unique `style_no`.
   - Buyer tracking, Standard Minute Value (SMV), and order quantities.
   - Deletion safety preventing removal of styles with active production history.

3. **Hourly Line Production & Industrial Metrics:**
   - Dynamic **Efficiency %** calculation:
     $$\text{Efficiency \%} = \left(\frac{\text{Output Qty} \times \text{SMV}}{\text{Operators Present} \times \text{Working Minutes}}\right) \times 100$$
   - Dynamic **Defects per Hundred Units (DHU %)** calculation:
     $$\text{DHU \%} = \left(\frac{\text{Defect Qty}}{\text{Output Qty}}\right) \times 100$$
   - **Cumulative Order Quantity Validation** using PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) preventing over-production.

4. **Logistics & Fleet Dispatch Management:**
   - Complete vehicle fleet management with capacity and status tracking (`Active`, `Under Maintenance`).
   - Vehicle trip scheduling with strict **Seat Capacity Validation**.
   - **Time Overlap Conflict Detection**:
     $$\text{existing\_departure} < \text{new\_return} \quad \text{AND} \quad \text{existing\_return} > \text{new\_departure}$$
   - Status lifecycle enforcement: `Scheduled` &rarr; `Dispatched` &rarr; `Completed` / `Cancelled`.

5. **Atomic CSV Bulk Production Upload:**
   - Bulk uploads with complete ACID transaction rollback (`BEGIN` ... `COMMIT` / `ROLLBACK`).
   - If any single row fails (syntax, non-existent style, or over-production), the entire batch is rolled back.

6. **Executive MIS Summary Dashboard:**
   - **Overall Factory Efficiency:** Dynamic weighted average based on earned vs available operator minutes.
   - **Critical Bottleneck Lines:** Identifies lines operating below 65% efficiency with exact additional pieces needed to recover target efficiency.
   - **Fleet Utilization:** Real-time percentage of active fleet currently dispatched.
   - **Style Completion:** Real-time production progress against order quantities.

---

## 📁 Folder Structure

```
GarmentFlow-MIS/
├── backend/
│   ├── database/
│   │   ├── schema.sql           # Database schema & indexes
│   │   └── seed.sql             # Idempotent seed data
│   ├── postman/
│   │   └── GarmentFlow-MIS.postman_collection.json
│   ├── scripts/
│   │   └── seed-admin.ts        # Admin seeder CLI
│   ├── src/
│   │   ├── app/
│   │   │   ├── config/          # Centralized configuration
│   │   │   ├── constants/       # Role & status constants
│   │   │   ├── db/              # pg Pool & connection tester
│   │   │   ├── errors/          # Custom ApiError
│   │   │   ├── middlewares/     # JWT auth, error handler, validation
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Authentication module
│   │   │   │   ├── style/       # Style management module
│   │   │   │   ├── production/  # Production & CSV upload module
│   │   │   │   ├── vehicle/     # Fleet management module
│   │   │   │   ├── trip/        # Dispatch & trip module
│   │   │   │   └── dashboard/   # Executive MIS dashboard module
│   │   │   └── routes/          # Unified /api and /api/v1 router
│   │   ├── app.ts               # Express application
│   │   └── server.ts            # Server entry point with graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── csv-tests/                   # Sample CSV test files for upload & rollback
├── screenshots/                 # Submission screenshot checklist
├── database.sql                 # Complete PostgreSQL dump
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/nayeem-miah/Majumder-Group-MIS.git
cd Majumder-Group-MIS/backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update credentials:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection String (Supabase Direct or Pooler)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require

# JWT
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_ACCESS_EXPIRES_IN=5d
JWT_REFRESH_EXPIRES_IN=30d

# Initial Admin Credentials (Optional / Seed)
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=your_secure_password
SALT_ROUNDS=12
```

### 3. Database Schema & Seed Data Import
Execute the schema and seed scripts using `psql` or the Supabase SQL Editor:
```bash
# In Supabase SQL Editor or via psql:
psql -d "YOUR_DATABASE_URL" -f database/schema.sql
psql -d "YOUR_DATABASE_URL" -f database/seed.sql
```

### 4. Admin Account Seed
Seed the initial administrator account:
```bash
npx ts-node scripts/seed-admin.ts
```

### 5. Run the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production build and run
npm run build
npm start
```

---

## 📡 API Endpoint Documentation

All management endpoints require Bearer JWT token header: `Authorization: Bearer <TOKEN>`.

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Authenticated admin profile
- `POST /api/auth/logout` - Clear auth cookies

### Garment Styles
- `POST /api/styles` - Create style
- `GET /api/styles` - Paginated list (`searchTerm`, `buyer_name`, sort)
- `GET /api/styles/:id` - Style details with cumulative production
- `PATCH /api/styles/:id` - Update style (locked against cumulative production)
- `DELETE /api/styles/:id` - Safe delete

### Line Production
- `POST /api/production` - Create hourly entry (locked with over-production check)
- `GET /api/production` - List production (`prod_date`, `floor_no`, `line_no`, `style_id`)
- `GET /api/production/:id` - Get production entry
- `PATCH /api/production/:id` - Update entry
- `DELETE /api/production/:id` - Delete entry
- `GET /api/production/summary` - Aggregated output, earned minutes & efficiency
- `POST /api/production/bulk-upload` - Atomic CSV upload (`multipart/form-data`)

### Vehicles & Transport
- `POST /api/vehicles` - Register vehicle
- `GET /api/vehicles` - List vehicles (`status`, `vehicle_type`)
- `GET /api/vehicles/:id` - Vehicle details
- `PATCH /api/vehicles/:id` - Update vehicle
- `PATCH /api/vehicles/:id/status` - Update status (`Active` / `Under Maintenance`)
- `DELETE /api/vehicles/:id` - Safe delete (fails if trips exist)

### Trips & Dispatch
- `GET /api/trips/availability` - Query available vehicles for time window
- `POST /api/trips` - Book trip (time overlap & seat capacity checks)
- `GET /api/trips` - List trips
- `GET /api/trips/:id` - Trip details
- `PATCH /api/trips/:id` - Update trip
- `PATCH /api/trips/:id/dispatch` - Transition `Scheduled` &rarr; `Dispatched`
- `PATCH /api/trips/:id/complete` - Transition `Dispatched` &rarr; `Completed`
- `PATCH /api/trips/:id/cancel` - Cancel trip

### Executive MIS Dashboard
- `GET /api/dashboard/summary` - Real-time metrics:
  - Overall Factory Efficiency
  - Critical Bottleneck Lines (< 65% efficiency)
  - Fleet Utilization
  - Style Completion Progress

---

## 🧪 Testing Instructions

Run the automated test suites:
```bash
# Verify TypeScript build
npx tsc --noEmit

# Run comprehensive MIS business logic tests
npx ts-node test-comprehensive-all.ts
```

---

## 📄 License
ISC License © Md Nayeem Miah
