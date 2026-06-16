# BillBuddy Web — API & Theme Audit

## Backend API

**Base URL:** `http://localhost:3000` (proxied via Vite dev server — no hardcoded host in frontend)

### Auth Routes
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /auth/register | `{ name, email, password }` | `{ user, accessToken, refreshToken }` |
| POST | /auth/login | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | /auth/logout | `{ refreshToken }` | `{ message }` |
| POST | /auth/refresh | `{ refreshToken }` | `{ accessToken, refreshToken }` |

### User Routes
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /users/profile | — | `{ id, name, email, avatar_url, push_token }` |
| PUT | /users/profile | `{ name, avatar_url }` | updated user |

### House Routes
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /houses | `{ name, address }` | `{ house }` |
| POST | /houses/join | `{ inviteCode }` | `{ house, member }` |
| GET | /houses/mine | — | `{ house }` or 404 |
| GET | /houses/members | — | `{ members }` |

### Expense Routes (house inferred from JWT via withUserHouse middleware)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /expenses | — | `{ expenses, total, limit, offset }` |
| POST | /expenses | `{ title, amount, category, date, splits? }` | `{ expense, splits }` |
| GET | /expenses/balances | — | `{ balances, debts }` |
| GET | /expenses/:id | — | `{ expense, splits }` |
| PUT | /expenses/:id | `{ title, amount, category, date }` | `{ expense }` |
| DELETE | /expenses/:id | — | `{ message }` |
| POST | /expenses/:id/settle | — | `{ split }` |

### Chore Routes (house inferred from JWT)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /chores | — | `{ chores }` |
| POST | /chores | `{ title, description, frequency, assigned_to, due_date }` | created chore |
| PUT | /chores/:id | same as POST body | updated chore |
| DELETE | /chores/:id | — | `{ message }` |
| POST | /chores/:id/complete | — | updated chore |
| GET | /chores/history | — | chore history |

Frequency options: `once`, `daily`, `weekly`, `monthly`

### Announcements
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /announcements | — | `{ announcements }` |
| POST | /announcements | `{ title, message }` | created announcement |
| DELETE | /announcements/:id | — | `{ message }` |

### Rules
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /rules | — | `{ rules }` |
| POST | /rules | `{ rule_text }` | created rule |
| DELETE | /rules/:id | — | `{ message }` |

### Notifications
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /notifications | — | `{ notifications }` |
| PUT | /notifications/read-all | — | `{ message }` |
| PUT | /notifications/:id/read | — | `{ notification }` |

## Authentication

- JWT Bearer tokens stored in `localStorage` (`billbuddy_token`, `billbuddy_refresh`)
- Access token TTL: 15 minutes; Refresh token TTL: 7 days
- Axios interceptor handles automatic token refresh on 401 with queue for concurrent requests

## Categories

`Rent` | `Groceries` | `Utilities` | `Internet` | `Cleaning` | `Other`

## Design Tokens

| Token | Value |
|-------|-------|
| primary | `#4F46E5` (indigo) |
| secondary | `#7C3AED` (purple) |
| success | `#10B981` (emerald) |
| danger | `#EF4444` (red) |
| warning | `#F59E0B` (amber) |
| background | `#F9FAFB` |
| surface | `#FFFFFF` |
| textPrimary | `#111827` |
| textSecondary | `#6B7280` |
| border | `#E5E7EB` |

## Navigation

**Desktop:** Fixed sidebar (264px wide) with NavLinks  
**Mobile:** Fixed bottom tab bar (5 items: Home, Expenses, Chores, Activity, Profile)

Sidebar also contains: Members, Balances, Announcements, House Rules
