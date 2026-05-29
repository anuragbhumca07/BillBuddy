-- ============================================================
-- BillBuddy - Seed Data
-- Migration: 002_seed_data.sql
-- All passwords are "password123"
-- bcrypt hash: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================

-- ============================================================
-- USERS (4 sample users)
-- ============================================================
INSERT INTO users (id, name, email, password_hash, avatar_url) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Alice Johnson',
    'alice@test.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Bob Martinez',
    'bob@test.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Carol Williams',
    'carol@test.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Dave Chen',
    'dave@test.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dave'
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- HOUSES (2 sample houses)
-- ============================================================
INSERT INTO houses (id, name, address, invite_code, created_by) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sunset Apartments',
    '123 Sunset Blvd, Apt 4B, Los Angeles, CA 90028',
    'SUNSET01',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Downtown Loft',
    '456 Main St, Unit 7, San Francisco, CA 94105',
    'DTOWN07',
    '33333333-3333-3333-3333-333333333333'
  )
ON CONFLICT (invite_code) DO NOTHING;

-- ============================================================
-- HOUSE MEMBERS
-- Alice and Bob → Sunset Apartments
-- Carol and Dave → Downtown Loft
-- ============================================================
INSERT INTO house_members (house_id, user_id, role) VALUES
  -- Sunset Apartments
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member'),
  -- Downtown Loft
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'member')
ON CONFLICT (house_id, user_id) DO NOTHING;

-- ============================================================
-- EXPENSES (10 total — 5 per house)
-- ============================================================
INSERT INTO expenses (id, house_id, paid_by, title, amount, category, date) VALUES
  -- Sunset Apartments (alice and bob)
  (
    'e1000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'May Rent',
    2400.00,
    'Rent',
    CURRENT_DATE - INTERVAL '14 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Whole Foods Grocery Run',
    156.40,
    'Groceries',
    CURRENT_DATE - INTERVAL '7 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Electric Bill - April',
    98.75,
    'Utilities',
    CURRENT_DATE - INTERVAL '10 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000004',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Comcast Internet',
    79.99,
    'Internet',
    CURRENT_DATE - INTERVAL '5 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000005',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Cleaning Supplies',
    42.30,
    'Cleaning',
    CURRENT_DATE - INTERVAL '3 days'
  ),
  -- Downtown Loft (carol and dave)
  (
    'e2000000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'June Rent',
    3200.00,
    'Rent',
    CURRENT_DATE - INTERVAL '12 days'
  ),
  (
    'e2000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'Trader Joe''s Run',
    88.65,
    'Groceries',
    CURRENT_DATE - INTERVAL '4 days'
  ),
  (
    'e2000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'Gas & Electric',
    121.50,
    'Utilities',
    CURRENT_DATE - INTERVAL '8 days'
  ),
  (
    'e2000000-0000-0000-0000-000000000004',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'AT&T Fiber',
    65.00,
    'Internet',
    CURRENT_DATE - INTERVAL '6 days'
  ),
  (
    'e2000000-0000-0000-0000-000000000005',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'Costco Household Items',
    203.80,
    'Other',
    CURRENT_DATE - INTERVAL '2 days'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- EXPENSE SPLITS (even splits between housemates)
-- ============================================================
INSERT INTO expense_splits (expense_id, user_id, amount_owed, is_settled, settled_at) VALUES
  -- May Rent ($2400 / 2 = $1200 each)
  ('e1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 1200.00, TRUE,  NOW() - INTERVAL '13 days'),
  ('e1000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1200.00, TRUE,  NOW() - INTERVAL '13 days'),
  -- Whole Foods ($156.40 / 2 = $78.20 each)
  ('e1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 78.20,  FALSE, NULL),
  ('e1000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 78.20,  TRUE,  NOW() - INTERVAL '6 days'),
  -- Electric Bill ($98.75 / 2 = $49.38 each)
  ('e1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 49.38,  TRUE,  NOW() - INTERVAL '9 days'),
  ('e1000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 49.37,  FALSE, NULL),
  -- Comcast Internet ($79.99 / 2 = $40.00 each)
  ('e1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 40.00,  FALSE, NULL),
  ('e1000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 39.99,  TRUE,  NOW() - INTERVAL '4 days'),
  -- Cleaning Supplies ($42.30 / 2 = $21.15 each)
  ('e1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 21.15,  TRUE,  NOW() - INTERVAL '2 days'),
  ('e1000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 21.15,  FALSE, NULL),
  -- June Rent ($3200 / 2 = $1600 each)
  ('e2000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 1600.00, TRUE,  NOW() - INTERVAL '11 days'),
  ('e2000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 1600.00, TRUE,  NOW() - INTERVAL '11 days'),
  -- Trader Joe's ($88.65 / 2 = $44.33 each)
  ('e2000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 44.33,  FALSE, NULL),
  ('e2000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 44.32,  TRUE,  NOW() - INTERVAL '3 days'),
  -- Gas & Electric ($121.50 / 2 = $60.75 each)
  ('e2000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 60.75,  TRUE,  NOW() - INTERVAL '7 days'),
  ('e2000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 60.75,  FALSE, NULL),
  -- AT&T Fiber ($65.00 / 2 = $32.50 each)
  ('e2000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 32.50,  FALSE, NULL),
  ('e2000000-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 32.50,  TRUE,  NOW() - INTERVAL '5 days'),
  -- Costco ($203.80 / 2 = $101.90 each)
  ('e2000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 101.90, FALSE, NULL),
  ('e2000000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 101.90, FALSE, NULL)
ON CONFLICT (expense_id, user_id) DO NOTHING;

-- ============================================================
-- CHORES (3 per house, 6 total)
-- ============================================================
INSERT INTO chores (id, house_id, title, description, frequency, assigned_to, due_date, is_completed) VALUES
  -- Sunset Apartments
  (
    'c1000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Vacuum Living Room',
    'Vacuum the living room carpet and under the couch cushions.',
    'weekly',
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE + INTERVAL '2 days',
    FALSE
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Take Out Trash & Recycling',
    'Bring all bins to the curb. Trash day is Wednesday.',
    'weekly',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '1 day',
    FALSE
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Clean Bathroom',
    'Scrub toilet, sink, and tub. Mop the floor and replace hand towels.',
    'monthly',
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE + INTERVAL '10 days',
    FALSE
  ),
  -- Downtown Loft
  (
    'c2000000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Wash Dishes',
    'Wash, dry, and put away all dishes in the sink.',
    'daily',
    '44444444-4444-4444-4444-444444444444',
    CURRENT_DATE,
    FALSE
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Mop Kitchen Floor',
    'Sweep and mop the kitchen floor thoroughly.',
    'weekly',
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE + INTERVAL '3 days',
    FALSE
  ),
  (
    'c2000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Buy Household Supplies',
    'Replenish paper towels, dish soap, toilet paper, and trash bags.',
    'monthly',
    '44444444-4444-4444-4444-444444444444',
    CURRENT_DATE + INTERVAL '15 days',
    FALSE
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- ANNOUNCEMENTS (2 per house)
-- ============================================================
INSERT INTO announcements (house_id, posted_by, title, message) VALUES
  -- Sunset Apartments
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Parking Lot Repaving This Weekend',
    'The building manager has notified us that the parking lot will be repaved this Saturday and Sunday. Please move your cars to the street by Friday night. Any cars left in the lot will be towed at owner''s expense.'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Guest Policy Reminder',
    'Just a friendly reminder that per our house agreement, overnight guests staying more than 3 nights in a row need to be communicated to all housemates in advance. Thanks for your cooperation!'
  ),
  -- Downtown Loft
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'New WiFi Password',
    'I upgraded our internet plan and had to reset the router. The new WiFi name is DowntownLoft5G and the password is loft2024secure. Update your devices!'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'Noise Curfew Starting June 1st',
    'We received a notice from the building regarding noise complaints. Starting June 1st, we need to keep noise levels down after 10 PM on weeknights and 11 PM on weekends. Let''s be considerate neighbors!'
  );

-- ============================================================
-- HOUSE RULES (2 per house)
-- ============================================================
INSERT INTO house_rules (house_id, rule_text, created_by) VALUES
  -- Sunset Apartments
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'All shared expenses must be logged in BillBuddy within 48 hours of purchase. Settlements are due by the 5th of each month.',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'The kitchen must be cleaned before going to bed — no dishes left in the sink overnight. Whoever cooks, the other person cleans.',
    '11111111-1111-1111-1111-111111111111'
  ),
  -- Downtown Loft
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Rent is due on the 1st of every month. Late payments after the 3rd will be subject to a $50 late fee split among non-paying members.',
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Quiet hours are 10 PM – 8 AM on weekdays and 11 PM – 9 AM on weekends. Headphones required for music and video calls during quiet hours.',
    '33333333-3333-3333-3333-333333333333'
  );

-- ============================================================
-- NOTIFICATIONS (sample unread notifications)
-- ============================================================
INSERT INTO notifications (user_id, type, message) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'expense_split',
    'Alice added a new expense "Electric Bill - April" — you owe $49.37.'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'expense_split',
    'Bob added a new expense "Comcast Internet" — you owe $40.00.'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'chore_reminder',
    'Your chore "Vacuum Living Room" is due in 2 days!'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'expense_split',
    'Carol added a new expense "Gas & Electric" — you owe $60.75.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'chore_reminder',
    'Your chore "Mop Kitchen Floor" is due in 3 days!'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'announcement',
    'Carol posted a new announcement: "New WiFi Password"'
  );
