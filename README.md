# BillBuddy

A full-stack roommate expense and chore management app.  
Roommates can track shared bills, split expenses, assign chores, post house announcements, and settle debts — all in one place.

**Stack:** Node.js + Express + PostgreSQL + Redis + Socket.IO (backend) · React Native + Expo (mobile)

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Running the Backend](#running-the-backend)
- [Running the Mobile App](#running-the-mobile-app)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker & Docker Compose | Docker Desktop 4.x+ | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node.js |
| Expo CLI | latest | `npm install -g expo-cli` |
| Expo Go (mobile) | latest | iOS App Store / Google Play |

---

## Project Structure

```
BillBuddy/
├── backend/                  # Express API server
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, validation, rate-limiting
│   │   ├── models/           # Database query functions
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic (notifications, cron)
│   │   └── utils/            # Shared helpers
│   ├── tests/                # Jest test suites
│   ├── Dockerfile
│   └── package.json
├── mobile/                   # React Native / Expo app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── navigation/       # React Navigation config
│   │   ├── screens/          # App screens
│   │   ├── services/         # API & socket clients
│   │   ├── store/            # Redux slices & store
│   │   └── utils/            # Formatters, constants
│   └── package.json
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Full schema (tables, indexes)
│   │   └── 002_seed_data.sql        # Sample users, houses, expenses, chores
│   └── seed.js               # Node.js migration runner
├── docker-compose.yml        # postgres + redis + backend + nginx
├── nginx.conf                # Reverse proxy config
└── .gitignore
```

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/billbuddy.git
cd BillBuddy
```

### 2. Start the Docker services

This starts PostgreSQL, Redis, the backend, and Nginx in one command.  
The `./database/migrations/` directory is mounted into the Postgres container and migrations run automatically on first start.

```bash
docker-compose up --build
```

The following ports will be available:

| Service   | Port | URL |
|-----------|------|-----|
| Nginx     | 80   | http://localhost/api/ |
| Backend   | 3000 | http://localhost:3000 |
| PostgreSQL| 5432 | postgresql://localhost:5432/billbuddy |
| Redis     | 6379 | redis://localhost:6379 |

### 3. Verify the services are healthy

```bash
docker-compose ps
# All containers should show status "healthy" or "Up"
```

### 4. (Optional) Run the seed script manually

The seed SQL runs automatically on first boot via `docker-entrypoint-initdb.d`.  
To re-run it manually (e.g., after wiping data):

```bash
DATABASE_URL=postgresql://billbuddy:billbuddy123@localhost:5432/billbuddy node database/seed.js
```

### 5. Reset the database

```bash
docker-compose down -v          # removes volumes (wipes all data)
docker-compose up --build       # re-creates fresh with seed data
```

---

## Running the Backend

### With Docker (recommended)

```bash
docker-compose up backend
# API available at http://localhost:3000
```

### Without Docker (bare metal)

```bash
cd backend
cp .env.example .env            # create a local .env (see Environment Variables below)
npm install
npm run dev                     # starts with nodemon hot-reload
```

Make sure PostgreSQL and Redis are running and `DATABASE_URL` / `REDIS_URL` are set in `.env`.

---

## Running the Mobile App

The mobile app connects to the backend via the `API_URL` environment variable.  
For local development on a physical device, replace `localhost` with your machine's LAN IP.

```bash
cd mobile
npm install
npx expo start
```

- Press `i` to open in iOS Simulator  
- Press `a` to open in Android Emulator  
- Scan the QR code with Expo Go on a physical device

### Pointing at a local backend

In `mobile/src/services/api.js` (or your Axios base URL config), set:

```js
const BASE_URL = 'http://192.168.1.x:3000';  // your LAN IP
```

Or set `EXPO_PUBLIC_API_URL` in a `mobile/.env` file.

---

## Running Tests

### Backend tests (Jest + Supertest)

```bash
cd backend
npm test
# or, with coverage:
npm test -- --coverage
```

Tests require a running PostgreSQL instance. The easiest way is to have  
`docker-compose up postgres` running, then run tests locally with  
`DATABASE_URL` pointing to it:

```bash
docker-compose up -d postgres
cd backend
DATABASE_URL=postgresql://billbuddy:billbuddy123@localhost:5432/billbuddy npm test
```

### Mobile tests (Jest)

```bash
cd mobile
npm test
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection URL |
| `JWT_SECRET` | Yes | — | Secret for signing access tokens (min 32 chars in prod) |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for signing refresh tokens (min 32 chars in prod) |
| `AWS_ACCESS_KEY_ID` | No | — | S3 access key (for receipt uploads) |
| `AWS_SECRET_ACCESS_KEY` | No | — | S3 secret key |
| `AWS_REGION` | No | `us-east-1` | S3 bucket region |
| `S3_BUCKET_NAME` | No | — | S3 bucket name for receipts |

Example `backend/.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://billbuddy:billbuddy123@localhost:5432/billbuddy
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretjwttokenchangeme32chars
JWT_REFRESH_SECRET=anotherrefreshsecretchangeme32chars
```

### Mobile (`mobile/.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Base URL for the backend API (e.g., `http://localhost:3000`) |

---

## API Reference

All REST endpoints are prefixed with `/api/` when accessed through Nginx.  
Direct backend access at `http://localhost:3000` (no prefix needed).

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Login and receive JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Invalidate refresh token |

### Houses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/houses` | Create a new house |
| `GET` | `/houses/:id` | Get house details |
| `POST` | `/houses/join` | Join a house via invite code |
| `GET` | `/houses/:id/members` | List all members |
| `DELETE` | `/houses/:id/members/:userId` | Remove a member (admin only) |
| `GET` | `/houses/:id/rules` | Get house rules |
| `POST` | `/houses/:id/rules` | Add a house rule |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/houses/:id/expenses` | List all expenses for a house |
| `POST` | `/houses/:id/expenses` | Add a new expense |
| `GET` | `/expenses/:id` | Get expense details with splits |
| `PUT` | `/expenses/:id` | Update an expense |
| `DELETE` | `/expenses/:id` | Delete an expense |
| `POST` | `/expenses/:id/settle` | Mark your split as settled |
| `GET` | `/houses/:id/balances` | Get net balance summary per member |

### Chores

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/houses/:id/chores` | List all chores for a house |
| `POST` | `/houses/:id/chores` | Create a new chore |
| `PUT` | `/chores/:id` | Update chore details |
| `POST` | `/chores/:id/complete` | Mark chore as completed |
| `DELETE` | `/chores/:id` | Delete a chore |
| `GET` | `/chores/:id/history` | View completion history |

### Announcements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/houses/:id/announcements` | List announcements |
| `POST` | `/houses/:id/announcements` | Post a new announcement |
| `DELETE` | `/announcements/:id` | Delete an announcement |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Get your notifications |
| `PUT` | `/notifications/:id/read` | Mark as read |
| `PUT` | `/notifications/read-all` | Mark all as read |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/me` | Get current user profile |
| `PUT` | `/users/me` | Update profile (name, avatar) |
| `PUT` | `/users/me/push-token` | Register Expo push token |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/uploads/receipt` | Upload a receipt image (multipart/form-data) |

---

## Database Schema

Nine tables power BillBuddy:

| Table | Purpose |
|-------|---------|
| `users` | Registered user accounts |
| `houses` | Shared living spaces with invite codes |
| `house_members` | Many-to-many: users ↔ houses with roles |
| `expenses` | Expenses paid by a user on behalf of the house |
| `expense_splits` | Per-member share of each expense + settlement status |
| `chores` | Recurring tasks assigned to house members |
| `chore_history` | Audit log of chore completions |
| `announcements` | House-wide announcements/posts |
| `house_rules` | Agreed-upon rules for the household |
| `notifications` | In-app notifications per user |

See `database/migrations/001_initial_schema.sql` for the full DDL.

### Seed users (password: `password123` for all)

| Name | Email |
|------|-------|
| Alice Johnson | alice@test.com |
| Bob Martinez | bob@test.com |
| Carol Williams | carol@test.com |
| Dave Chen | dave@test.com |

| House | Members | Invite Code |
|-------|---------|-------------|
| Sunset Apartments | Alice (admin), Bob | `SUNSET01` |
| Downtown Loft | Carol (admin), Dave | `DTOWN07` |
