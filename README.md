<div align="center">

# 🏭 Majumder Group — GarmentFlow MIS

**Enterprise Management Information System for Apparel Manufacturers**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white&style=flat-square)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

[Live Demo](#-live-demo) · [Quick Start](#-quick-start) · [Deploy on Vercel](#-deploy-on-vercel) · [API Docs](#-api-reference)

</div>

---

## 📌 Overview

**GarmentFlow MIS** is a full-stack, production-ready Management Information System built for the garment and apparel manufacturing industry. It provides real-time visibility and control over:

- **Floor & Line Production** — efficiency, DHU, hourly tracking
- **Style & Order Management** — buyers, SMV, order quantities, completion %
- **Vehicle Fleet & Trip Dispatch** — scheduling, conflict detection, utilization
- **Atomic CSV Bulk Uploads** — ACID-compliant batch imports with rollback
- **Executive Dashboard** — live KPIs: factory efficiency, bottleneck lines, fleet utilization, style completion

> **Architecture constraint:** 100% Raw SQL — no ORMs. All queries use parameterized `pg` statements directly against PostgreSQL.

---

## ✨ Features

| Module | Capability |
|---|---|
| 🔐 **Auth** | JWT (Bearer + HTTP-only cookie), bcrypt, demo login, session guard |
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
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Language | TypeScript 5.x |
| Database | Supabase / PostgreSQL 15+ |
| DB Driver | `pg` (raw parameterized SQL — no ORM) |
| Auth | `jsonwebtoken` + HTTP-only Cookies + Bearer Tokens |
| Password | `bcrypt` (12 salt rounds) |
| Validation | Zod schemas |
| File Upload | Multer (strict MIME + extension filtering) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Toasts | Sonner |

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| 🌐 Frontend | *(add after deployment)* |
| ⚙️ Backend API | *(add after deployment)* |

**Demo credentials** are available via the **Demo Login** button on the login page (configured via `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` environment variables).

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
npm run dev              # starts on http://localhost:5000
```

### 3. Database setup

Run the schema SQL in your Supabase SQL Editor (or via `psql`):

```bash
# Schema + indexes
psql "$DATABASE_URL" -f backend/database/schema.sql

# Optional seed data
psql "$DATABASE_URL" -f backend/database/seed.sql

# Seed the first admin account from .env
npx ts-node backend/scripts/seed-admin.ts
```

### 4. Frontend setup

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                   # starts on http://localhost:3000
```

Open **http://localhost:3000** and sign in.

---

## ☁️ Deploy on Vercel

This project deploys as **two separate Vercel projects** — one for the backend, one for the frontend.

### Deploy the Backend

1. Import the repo on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** → `backend`
3. Set **Framework Preset** → `Other`
4. Add these **Environment Variables**:

```
DATABASE_URL          postgresql://...
JWT_ACCESS_SECRET     <random-secret>
JWT_REFRESH_SECRET    <random-secret>
JWT_ACCESS_EXPIRES_IN 5d
JWT_REFRESH_EXPIRES_IN 30d
ADMIN_EMAIL           admin@example.com
ADMIN_PASSWORD        your_secure_password
DEMO_ADMIN_EMAIL      admin@example.com
DEMO_ADMIN_PASSWORD   your_secure_password
NODE_ENV              production
```

5. Deploy. Copy the production URL (e.g. `https://majumder-api.vercel.app`).

### Deploy the Frontend

1. Import the **same repo** again on Vercel
2. Set **Root Directory** → `frontend`
3. Set **Framework Preset** → `Next.js`
4. Add this **Environment Variable**:

```
NEXT_PUBLIC_API_URL   https://your-backend.vercel.app/api
```

5. Deploy. The frontend is live.

---

## 📁 Project Structure

```
Majumder-Group-MIS/
├── backend/
│   ├── database/
│   │   ├── schema.sql            # Tables, indexes, constraints
│   │   └── seed.sql              # Optional demo data
│   ├── scripts/
│   │   └── seed-admin.ts         # One-time admin account seeder
│   ├── src/
│   │   ├── app/
│   │   │   ├── config/           # Centralised env config
│   │   │   ├── db/               # pg Pool + connection test
│   │   │   ├── middlewares/      # JWT auth, error handler, Zod validation
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── style/
│   │   │   │   ├── production/
│   │   │   │   ├── vehicle/
│   │   │   │   ├── trip/
│   │   │   │   └── dashboard/
│   │   │   └── routes/           # /api and /api/v1 unified router
│   │   ├── app.ts                # Express app (Vercel entry point)
│   │   └── server.ts             # HTTP server for local dev
│   ├── vercel.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/        # All dashboard pages
│   │   │   │   ├── page.tsx      # Executive overview
│   │   │   │   ├── styles/
│   │   │   │   ├── production/
│   │   │   │   ├── hourly-production/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── trips/
│   │   │   │   └── csv-upload/
│   │   │   └── login/
│   │   ├── components/
│   │   │   ├── AppShell.tsx      # Sidebar + header layout
│   │   │   ├── Crud.tsx          # Generic CRUD table + modal
│   │   │   ├── StyleCombobox.tsx # Searchable style picker
│   │   │   └── ui.tsx            # Button, Card, Badge, etc.
│   │   └── lib/
│   │       ├── api.ts            # Typed fetch wrapper
│   │       └── types.ts          # Shared TypeScript types
│   └── .env.example
├── csv-tests/                    # Sample CSV files for bulk upload testing
├── database.sql                  # Full PostgreSQL dump
└── README.md
```

---

## 📡 API Reference

All endpoints under `/api/*` require `Authorization: Bearer <token>` (except `/auth/login` and `/auth/demo-login`).

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Email + password login |
| `POST` | `/api/auth/demo-login` | Server-resolved demo login |
| `GET` | `/api/auth/me` | Authenticated admin profile |
| `POST` | `/api/auth/logout` | Clear auth cookies |

### Styles
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/styles` | Create style |
| `GET` | `/api/styles` | Paginated list (`searchTerm`, `buyer_name`) |
| `GET` | `/api/styles/:id` | Style detail + cumulative production |
| `PATCH` | `/api/styles/:id` | Update style |
| `DELETE` | `/api/styles/:id` | Safe delete (blocked if production history exists) |

### Production
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/production` | Create hourly entry (over-production lock) |
| `GET` | `/api/production` | List entries (`prod_date`, `floor_no`, `line_no`, `style_id`) |
| `PATCH` | `/api/production/:id` | Update entry |
| `DELETE` | `/api/production/:id` | Delete entry |
| `GET` | `/api/production/summary` | Aggregated efficiency metrics |
| `POST` | `/api/production/bulk-upload` | Atomic CSV import (`multipart/form-data`) |

### Vehicles
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/vehicles` | Register vehicle |
| `GET` | `/api/vehicles` | List (`status`, `vehicle_type`) |
| `PATCH` | `/api/vehicles/:id` | Update vehicle |
| `PATCH` | `/api/vehicles/:id/status` | Change status |
| `DELETE` | `/api/vehicles/:id` | Delete (blocked if trips exist) |

### Trips
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trips` | Schedule trip (overlap + capacity check) |
| `GET` | `/api/trips` | List trips (`status`) |
| `PATCH` | `/api/trips/:id/dispatch` | `Scheduled` → `Dispatched` |
| `PATCH` | `/api/trips/:id/complete` | `Dispatched` → `Completed` |
| `PATCH` | `/api/trips/:id/cancel` | Cancel trip |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Live KPIs: efficiency, bottlenecks, fleet, styles |

---

## 🧮 Business Logic

**Efficiency %**
$$\text{Efficiency} = \frac{\text{Output} \times \text{SMV}}{\text{Operators} \times \text{Working Minutes}} \times 100$$

**DHU (Defects per Hundred Units)**
$$\text{DHU} = \frac{\text{Defect Qty}}{\text{Output Qty}} \times 100$$

**Bottleneck threshold:** Lines below **65% efficiency** are flagged with the additional pieces required to reach target.

**Trip conflict detection:**
$$\text{existing\_dep} < \text{new\_return} \quad \text{AND} \quad \text{existing\_ret} > \text{new\_dep}$$

---

## 📄 License

ISC License © [Md Nayeem Miah](https://github.com/nayeem-miah)
