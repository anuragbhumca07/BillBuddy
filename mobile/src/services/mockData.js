// ─── BillBuddy Demo / Mock Data ────────────────────────────────────────────
// Provides realistic offline data so the app works without a backend.
// All IDs are strings to match the real API shape.

export const DEMO_USER = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'demo@billbuddy.app',
  avatar: null,
  role: 'admin',
};

const MEMBER_2 = { id: 'user-2', name: 'Jamie Lee', email: 'jamie@billbuddy.app', avatar: null };
const MEMBER_3 = { id: 'user-3', name: 'Sam Rivera', email: 'sam@billbuddy.app', avatar: null };

export const DEMO_HOUSE = {
  id: 'house-1',
  name: 'The Dream Team',
  invite_code: 'DREAM42',
  inviteCode: 'DREAM42',
  address: '42 Maple Street, Apt 3B',
  members: [
    { id: 'mem-1', user: DEMO_USER, user_id: DEMO_USER.id, role: 'admin' },
    { id: 'mem-2', user: MEMBER_2, user_id: MEMBER_2.id, role: 'member' },
    { id: 'mem-3', user: MEMBER_3, user_id: MEMBER_3.id, role: 'member' },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
};

export const DEMO_EXPENSES = [
  {
    id: 'exp-1',
    title: 'Monthly Rent',
    amount: 2400,
    category: 'Rent',
    paid_by: DEMO_USER.id,
    paidBy: DEMO_USER,
    splits: [
      { user: DEMO_USER, user_id: DEMO_USER.id, amount: 800, settled: true },
      { user: MEMBER_2, user_id: MEMBER_2.id, amount: 800, settled: false },
      { user: MEMBER_3, user_id: MEMBER_3.id, amount: 800, settled: false },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Paid via bank transfer',
    house_id: 'house-1',
  },
  {
    id: 'exp-2',
    title: 'Grocery Run',
    amount: 156.80,
    category: 'Groceries',
    paid_by: MEMBER_2.id,
    paidBy: MEMBER_2,
    splits: [
      { user: DEMO_USER, user_id: DEMO_USER.id, amount: 52.27, settled: false },
      { user: MEMBER_2, user_id: MEMBER_2.id, amount: 52.27, settled: true },
      { user: MEMBER_3, user_id: MEMBER_3.id, amount: 52.26, settled: false },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Weekend shopping',
    house_id: 'house-1',
  },
  {
    id: 'exp-3',
    title: 'Electricity Bill',
    amount: 134.50,
    category: 'Utilities',
    paid_by: DEMO_USER.id,
    paidBy: DEMO_USER,
    splits: [
      { user: DEMO_USER, user_id: DEMO_USER.id, amount: 44.84, settled: true },
      { user: MEMBER_2, user_id: MEMBER_2.id, amount: 44.83, settled: false },
      { user: MEMBER_3, user_id: MEMBER_3.id, amount: 44.83, settled: false },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    house_id: 'house-1',
  },
  {
    id: 'exp-4',
    title: 'Internet & Cable',
    amount: 89.99,
    category: 'Internet',
    paid_by: MEMBER_3.id,
    paidBy: MEMBER_3,
    splits: [
      { user: DEMO_USER, user_id: DEMO_USER.id, amount: 30.00, settled: false },
      { user: MEMBER_2, user_id: MEMBER_2.id, amount: 30.00, settled: false },
      { user: MEMBER_3, user_id: MEMBER_3.id, amount: 29.99, settled: true },
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    house_id: 'house-1',
  },
  {
    id: 'exp-5',
    title: 'Cleaning Supplies',
    amount: 45.25,
    category: 'Cleaning',
    paid_by: MEMBER_2.id,
    paidBy: MEMBER_2,
    splits: [
      { user: DEMO_USER, user_id: DEMO_USER.id, amount: 15.09, settled: false },
      { user: MEMBER_2, user_id: MEMBER_2.id, amount: 15.08, settled: true },
      { user: MEMBER_3, user_id: MEMBER_3.id, amount: 15.08, settled: false },
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    house_id: 'house-1',
  },
];

export const DEMO_BALANCES = {
  youOwe: 127.36,
  youAreOwed: 889.66,
  debts: [
    { id: 'debt-1', from: DEMO_USER.id, to: MEMBER_2.id, fromUser: DEMO_USER, toUser: MEMBER_2, amount: 67.35, description: 'Grocery Run + Cleaning' },
    { id: 'debt-2', from: DEMO_USER.id, to: MEMBER_3.id, fromUser: DEMO_USER, toUser: MEMBER_3, amount: 60.01, description: 'Internet & Cable' },
    { id: 'debt-3', from: MEMBER_2.id, to: DEMO_USER.id, fromUser: MEMBER_2, toUser: DEMO_USER, amount: 844.83, description: 'Rent + Electricity' },
    { id: 'debt-4', from: MEMBER_3.id, to: DEMO_USER.id, fromUser: MEMBER_3, toUser: DEMO_USER, amount: 44.83, description: 'Electricity Bill' },
  ],
  memberBalances: [
    { user: DEMO_USER, net: 762.30 },
    { user: MEMBER_2, net: -777.48 },
    { user: MEMBER_3, net: -15.18 },
  ],
};

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

export const DEMO_CHORES = [
  {
    id: 'chore-1',
    title: 'Take out trash',
    description: 'Empty all bins and take to curb by 8 AM',
    assignedTo: DEMO_USER,
    assigned_to: DEMO_USER.id,
    dueDate: tomorrow,
    due_date: tomorrow,
    completed: false,
    priority: 'high',
    recurring: 'weekly',
    house_id: 'house-1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'chore-2',
    title: 'Vacuum living room',
    description: 'Including under the sofa and rugs',
    assignedTo: MEMBER_2,
    assigned_to: MEMBER_2.id,
    dueDate: nextWeek,
    due_date: nextWeek,
    completed: false,
    priority: 'medium',
    recurring: 'weekly',
    house_id: 'house-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'chore-3',
    title: 'Clean bathroom',
    description: 'Toilet, sink, shower, and floors',
    assignedTo: MEMBER_3,
    assigned_to: MEMBER_3.id,
    dueDate: nextWeek,
    due_date: nextWeek,
    completed: false,
    priority: 'high',
    recurring: 'biweekly',
    house_id: 'house-1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'chore-4',
    title: 'Wash dishes',
    description: 'All dishes and pots in the sink',
    assignedTo: DEMO_USER,
    assigned_to: DEMO_USER.id,
    dueDate: yesterday,
    due_date: yesterday,
    completed: false,
    priority: 'high',
    recurring: 'daily',
    house_id: 'house-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'chore-5',
    title: 'Buy groceries',
    description: 'See shared list on the fridge',
    assignedTo: MEMBER_2,
    assigned_to: MEMBER_2.id,
    dueDate: nextWeek,
    due_date: nextWeek,
    completed: true,
    priority: 'medium',
    recurring: 'weekly',
    house_id: 'house-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Rent due on the 1st!',
    message: 'Just a reminder that rent is due on the 1st of every month. Please transfer your share to Alex by then. Late payments will incur a $25 fee.',
    postedBy: DEMO_USER,
    posted_by: DEMO_USER.id,
    pinned: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    house_id: 'house-1',
  },
  {
    id: 'ann-2',
    title: 'Cleaning schedule updated',
    message: 'Hey everyone! I updated the cleaning schedule in the house rules. Please check and confirm you\'re okay with your assigned days. Thanks!',
    postedBy: MEMBER_2,
    posted_by: MEMBER_2.id,
    pinned: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    house_id: 'house-1',
  },
  {
    id: 'ann-3',
    title: 'Guests this weekend',
    message: 'I\'ll have a couple friends over Saturday evening. Just giving everyone a heads up. I\'ll clean up after!',
    postedBy: MEMBER_3,
    posted_by: MEMBER_3.id,
    pinned: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    house_id: 'house-1',
  },
];

export const DEMO_RULES = [
  { id: 'rule-1', text: 'Quiet hours after 11 PM on weekdays (1 AM on weekends). No loud music or parties.', house_id: 'house-1' },
  { id: 'rule-2', text: 'Clean dishes the same day. No dishes left in the sink overnight.', house_id: 'house-1' },
  { id: 'rule-3', text: 'Follow the weekly chore rotation. If you can\'t do your chore, arrange a swap.', house_id: 'house-1' },
  { id: 'rule-4', text: 'Give at least 24 hours notice before bringing guests over.', house_id: 'house-1' },
  { id: 'rule-5', text: 'Shared household items (cleaning supplies, toilet paper) are split equally.', house_id: 'house-1' },
];

export const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'expense',
    title: 'New expense added',
    message: 'Jamie added "Grocery Run" — you owe $52.27',
    read: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'chore',
    title: 'Chore due tomorrow',
    message: '"Take out trash" is due tomorrow. Don\'t forget!',
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'announcement',
    title: 'New announcement',
    message: 'Alex posted: "Rent due on the 1st!"',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_CHORE_HISTORY = [
  {
    id: 'hist-1',
    choreId: 'chore-5',
    title: 'Buy groceries',
    completedBy: MEMBER_2,
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-2',
    choreId: 'chore-1',
    title: 'Take out trash',
    completedBy: DEMO_USER,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
