<div align="center">

# 🏭 Majumder Group MIS

**Enterprise Management Information System for Apparel Manufacturing**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white&style=flat-square)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white&style=flat-square)](https://vercel.com)

</div>

---

## 🌐 Live Links

| Service | URL | Status |
|---------|-----|--------|
| 🖥️ **Frontend** | [majumdergroup-mls.vercel.app](https://majumdergroup-mls.vercel.app) | ✅ Live |
| ⚙️ **Backend API** | [majumder-group-mls-api.vercel.app](https://majumder-group-mls-api.vercel.app) | ✅ Live |
| 📦 **GitHub Repo** | [github.com/nayeem-miah/Majumder-Group-MIS](https://github.com/nayeem-miah/Majumder-Group-MIS) | Public |

### 🔐 Demo Login Credentials
```
Email:    admin@gmail.com
Password: 123456
```

---

## 📌 Overview

**Majumder Group MIS** is a full-stack, production-ready Management Information System built for the garment and apparel manufacturing industry. It provides real-time visibility and control over:

- **Floor & Line Production** — efficiency %, DHU %, hourly tracking
- **Style & Order Management** — buyers, SMV, order quantities, completion %
- **Vehicle Fleet & Trip Dispatch** — scheduling, conflict detection, utilization
- **Atomic CSV Bulk Uploads** — ACID-compliant batch imports with rollback
- **Executive Dashboard** — live KPIs: factory efficiency, bottleneck lines, fleet utilization, style completion

> **Architecture:** 100% Raw SQL — no ORM. All queries use parameterized `pg` statements directly against PostgreSQL (Supabase).

---

## ✨ Features

| Module | Capability |
|--------|-----------|
| 🔐 **Auth** | JWT (Bearer + HTTP-only cookie), bcrypt, session guard |
| 👕 **Styles** | CRUD, buyer tracking, SMV, order qty, deletion safety |
| 🏭 **Production** | Hourly entries, efficiency %, DHU %, over-production lock (`SELECT FOR UPDATE`) |
| 📊 **Dashboard** | Factory efficiency, bottleneck lines, fleet utilization, style completion |
| 🚛 **Vehicles** | Fleet registry, seat capacity, `Active` / `Under Maintenance` status |
| 🗺️ **Trips** | Scheduling with time-overlap detection, seat capacity check, status lifecycle |
| 📂 **CSV Upload** | Atomic batch import — full rollback if any single row fails |

---

## 🛠 Technology Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Language | TypeScript 5.x |
| Database | Supabase / PostgreSQL 15+ |
| DB Driver | `pg` (raw parameterized SQL — no ORM) |
| Auth | `jsonwebtoken` + HTTP-only Cookies + Bearer Tokens |
| Password | `bcrypt` (12 salt rounds) |
| Validation | Zod schemas |
| File Upload | Multer (strict MIME + extension filtering) |
| Hosting | Vercel (Serverless) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Toasts | Sonner |
| Hosting | Vercel |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or a [Supabase](https://supabase.com) project)

### 1. Clone the repository

```bash
git clone https://github.com/nayeem-miah/Majumder-Group-MIS.git
cd Majumder-Group-MIS
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env     # fill in DATABASE_URL, JWT secrets, ADMIN credentials
npm install
npm run dev              # starts on http://localhost:8321
```

### 3. Database setup

Run the schema SQL in your Supabase SQL Editor (or via `psql`):

```bash
# Schema + indexes + triggers
psql "$DATABASE_URL" -f backend/database/schema.sql

# Optional seed data
psql "$DATABASE_URL" -f backend/database/seed.sql
```

### 4. Frontend setup

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8321/api
npm install
npm run dev                   # starts on http://localhost:3000
```

Open **http://localhost:3000** and sign in with:
```
Email:    admin@gmail.com
Password: 123456
```

---

## ☁️ Deploy on Vercel

This project deploys as **two separate Vercel projects** — one for the backend, one for the frontend.

### Backend Deployment

```bash
cd backend
vercel --prod
```

**Root Directory:** `backend`

**Environment Variables to set in Vercel Dashboard:**
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
NODE_ENV=production
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=5d
JWT_REFRESH_EXPIRES_IN=30d
JWT_RESET_PASS_SECRET=your-reset-secret
JWT_RESET_PASS_EXPIRES_IN=5m
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=your-admin-password
SALT_ROUNDS=12
```

### Frontend Deployment

```bash
cd frontend
vercel --prod
```

**Root Directory:** `frontend`

**Environment Variables to set in Vercel Dashboard:**
```env
NEXT_PUBLIC_API_URL=https://majumder-group-mls-api.vercel.app/api
```

---

## 📁 Project Structure

```
Majumder-Group-MIS/
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── config/           # Centralised env config
│   │   │   ├── db/               # pg Pool + connection test
│   │   │   ├── middlewares/      # JWT auth, error handler, Zod validation
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Login, JWT, password reset
│   │   │   │   ├── style/        # Style CRUD
│   │   │   │   ├── production/   # Production + CSV bulk upload
│   │   │   │   ├── vehicle/      # Vehicle fleet management
│   │   │   │   ├── trip/         # Trip scheduling
│   │   │   │   └── dashboard/    # Executive KPI summary
│   │   │   └── routes/           # /api and /api/v1 unified router
│   │   ├── app.ts                # Express app (Vercel serverless entry)
│   │   └── server.ts             # HTTP server for local dev
│   ├── database/
│   │   ├── schema.sql            # 5 tables, FK, indexes, triggers
│   │   └── seed.sql              # Sample seed data
│   ├── vercel.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/        # All dashboard pages
│   │   │   │   ├── page.tsx      # Executive overview
│   │   │   │   ├── styles/
│   │   │   │   ├── production/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── trips/
│   │   │   │   └── csv-upload/
│   │   │   └── login/
│   │   ├── components/
│   │   │   ├── AppShell.tsx      # Sidebar + header layout
│   │   │   └── ui.tsx            # Button, Card, Badge, etc.
│   │   └── lib/
│   │       ├── api.ts            # Typed fetch wrapper
│   │       └── types.ts          # Shared TypeScript types
│   └── .env.example
├── csv-tests/                    # Sample CSV files for bulk upload testing
├── database.sql                  # Full PostgreSQL schema + seed dump
└── README.md
```

---

## 📡 API Reference

**Base URL:** `https://majumder-group-mls-api.vercel.app/api`

All endpoints require `Authorization: Bearer <token>` except `/auth/login`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Email + password login → JWT |
| `GET` | `/auth/me` | Authenticated admin profile |
| `POST` | `/auth/logout` | Clear auth cookies |

### Styles
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/styles` | Create style |
| `GET` | `/styles` | Paginated list (`searchTerm`, `buyer_name`) |
| `GET` | `/styles/:id` | Style detail + cumulative production |
| `PATCH` | `/styles/:id` | Update style |
| `DELETE` | `/styles/:id` | Safe delete (blocked if production history exists) |

### Production
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/production` | Create hourly entry (over-production lock) |
| `GET` | `/production` | List entries (filter by `prod_date`, `floor_no`, `line_no`, `style_id`) |
| `PATCH` | `/production/:id` | Update entry |
| `DELETE` | `/production/:id` | Delete entry |
| `GET` | `/production/summary` | Aggregated efficiency metrics |
| `POST` | `/production/bulk-upload` | Atomic CSV import (`multipart/form-data`) |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vehicles` | Register vehicle |
| `GET` | `/vehicles` | List (filter by `status`, `vehicle_type`) |
| `PATCH` | `/vehicles/:id` | Update vehicle |
| `PATCH` | `/vehicles/:id/status` | Change status |
| `DELETE` | `/vehicles/:id` | Delete (blocked if trips exist) |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/trips` | Schedule trip (overlap + capacity check) |
| `GET` | `/trips` | List trips (filter by `status`) |
| `PATCH` | `/trips/:id/dispatch` | `Scheduled` → `Dispatched` |
| `PATCH` | `/trips/:id/complete` | `Dispatched` → `Completed` |
| `PATCH` | `/trips/:id/cancel` | Cancel trip |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/summary` | Live KPIs: efficiency, bottlenecks, fleet, styles |

---

## 🧮 Business Logic

**Efficiency %**

$$\text{Efficiency} = \frac{\text{Output} \times \text{SMV}}{\text{Operators} \times \text{Working Minutes}} \times 100$$

**DHU (Defects per Hundred Units)**

$$\text{DHU} = \frac{\text{Defect Qty}}{\text{Output Qty}} \times 100$$

**Bottleneck threshold:** Lines below **65% efficiency** are flagged.

**Trip conflict detection:** Prevents double-booking the same vehicle for overlapping time windows.

**Over-production lock:** `SELECT FOR UPDATE` prevents cumulative production from exceeding `order_qty`.

---

## 🗄️ Database Schema

```sql
-- 5 core tables
admins          -- System administrators (email, password_hash, JWT)
styles          -- Garment styles (buyer, style_no, SMV, order_qty)
line_production -- Daily floor/line production entries (efficiency, DHU)
vehicles        -- Fleet registry (reg_no, type, seat_capacity, status)
trips           -- Trip scheduling (vehicle, route, times, passenger_count)
```

All tables include `created_at` / `updated_at` with auto-update triggers.

---

## 📄 License

ISC License © [Md Nayeem Miah](https://github.com/nayeem-miah)
