-- ============================================================
-- BillBuddy - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  push_token    TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- HOUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS houses (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  address     TEXT,
  invite_code VARCHAR(10)  UNIQUE NOT NULL,
  created_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- HOUSE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS house_members (
  id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id  UUID        NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(house_id, user_id)
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id    UUID           NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  paid_by     UUID           NOT NULL REFERENCES users(id),
  title       VARCHAR(200)   NOT NULL,
  amount      DECIMAL(10,2)  NOT NULL CHECK (amount > 0),
  category    VARCHAR(50)    DEFAULT 'Other'
                CHECK (category IN ('Rent', 'Groceries', 'Utilities', 'Internet', 'Cleaning', 'Other')),
  receipt_url TEXT,
  date        DATE           DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ    DEFAULT NOW()
);

-- ============================================================
-- EXPENSE SPLITS
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id  UUID          NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id     UUID          NOT NULL REFERENCES users(id),
  amount_owed DECIMAL(10,2) NOT NULL,
  is_settled  BOOLEAN       DEFAULT FALSE,
  settled_at  TIMESTAMPTZ,
  UNIQUE(expense_id, user_id)
);

-- ============================================================
-- CHORES
-- ============================================================
CREATE TABLE IF NOT EXISTS chores (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id     UUID         NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  frequency    VARCHAR(20)  DEFAULT 'weekly'
                 CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  assigned_to  UUID         REFERENCES users(id),
  due_date     DATE,
  is_completed BOOLEAN      DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- CHORE HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS chore_history (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  chore_id     UUID        NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  completed_by UUID        NOT NULL REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id   UUID         NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  posted_by  UUID         NOT NULL REFERENCES users(id),
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- HOUSE RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS house_rules (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id   UUID        NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  rule_text  TEXT        NOT NULL,
  created_by UUID        NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_house_members_house    ON house_members(house_id);
CREATE INDEX IF NOT EXISTS idx_house_members_user     ON house_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_house         ON expenses(house_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user    ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_chores_house           ON chores(house_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id);
