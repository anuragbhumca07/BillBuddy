// ─── Mock API Handler ────────────────────────────────────────────────────────
// Intercepts axios requests and returns mock data when the real API is
// unreachable (network errors).  Maintains an in-memory mutable store so
// create / update / delete operations feel real during a demo session.

import {
  DEMO_USER,
  DEMO_HOUSE,
  DEMO_EXPENSES,
  DEMO_BALANCES,
  DEMO_CHORES,
  DEMO_ANNOUNCEMENTS,
  DEMO_RULES,
  DEMO_NOTIFICATIONS,
  DEMO_CHORE_HISTORY,
} from './mockData';

// ── In-memory mutable state ──────────────────────────────────────────────────
let _user = { ...DEMO_USER };
let _house = JSON.parse(JSON.stringify(DEMO_HOUSE));
let _expenses = JSON.parse(JSON.stringify(DEMO_EXPENSES));
let _balances = JSON.parse(JSON.stringify(DEMO_BALANCES));
let _chores = JSON.parse(JSON.stringify(DEMO_CHORES));
let _announcements = JSON.parse(JSON.stringify(DEMO_ANNOUNCEMENTS));
let _rules = JSON.parse(JSON.stringify(DEMO_RULES));
let _notifications = JSON.parse(JSON.stringify(DEMO_NOTIFICATIONS));
let _history = JSON.parse(JSON.stringify(DEMO_CHORE_HISTORY));
let _expenseHistory = [
  { id: 'ehist-1', expenseId: 'exp-1', action: 'created', changedBy: DEMO_USER, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Expense created' },
  { id: 'ehist-2', expenseId: 'exp-2', action: 'created', changedBy: DEMO_USER, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: 'Expense created' },
];

let _idCounter = 1000;
const nextId = (prefix = 'item') => `${prefix}-${++_idCounter}`;

// ── Route matching helpers ───────────────────────────────────────────────────
const match = (method, url, pattern) => {
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
  return method === 'match_any' || regex.test(url);
};

const param = (url, pattern) => {
  const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '(?<$1>[^/]+)') + '$');
  return url.match(regex)?.groups || {};
};

// ── Response builder ─────────────────────────────────────────────────────────
const ok = (data) => ({ data, status: 200 });
const created = (data) => ({ data, status: 201 });
const notFound = () => { const e = new Error('Not found'); e.response = { status: 404 }; throw e; };

// ── Main handler ─────────────────────────────────────────────────────────────
export function handleMockRequest(config) {
  const method = config.method?.toLowerCase() || 'get';
  // Strip base URL to get path
  const url = config.url?.replace(/^https?:\/\/[^/]+/, '') || '';
  let body = {};
  try {
    body = config.data
      ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
      : {};
    // FormData can't be accessed like a plain object — treat as empty
    if (typeof body?.get === 'function') body = {};
  } catch {
    body = {};
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (method === 'post' && url === '/auth/login') {
    if (body.email === 'demo@billbuddy.app' || body.email === _user.email) {
      return ok({ user: _user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
    }
    const err = new Error('Invalid credentials'); err.response = { status: 401, data: { message: 'Invalid email or password' } }; throw err;
  }
  if (method === 'post' && url === '/auth/register') {
    _user = { id: nextId('user'), name: body.name, email: body.email, avatar: null, role: 'admin' };
    return created({ user: _user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  }
  if (method === 'post' && url === '/auth/logout') return ok({ success: true });
  if (method === 'post' && url === '/auth/refresh') return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });

  // ── Users / Profile ────────────────────────────────────────────────────────
  if (method === 'put' && url === '/users/profile') {
    _user = { ..._user, ...body };
    return ok({ user: _user });
  }
  if (method === 'put' && url === '/users/profile/avatar') {
    return ok({ user: _user });
  }

  // ── Houses ─────────────────────────────────────────────────────────────────
  if (method === 'get' && url === '/houses/mine') return ok({ house: _house });
  if (method === 'post' && url === '/houses') {
    _house = {
      id: nextId('house'), name: body.name, invite_code: 'HOUSE01',
      address: body.address || '', members: [{ id: nextId('mem'), user: _user, user_id: _user.id, role: 'admin' }],
      created_at: new Date().toISOString(),
    };
    return created({ house: _house });
  }
  if (method === 'post' && url === '/houses/join') {
    if (body.code === _house.invite_code || body.invite_code === _house.invite_code) {
      return ok({ house: _house });
    }
    const err = new Error('Invalid code'); err.response = { status: 400, data: { message: 'Invalid invite code' } }; throw err;
  }
  if (method === 'put' && url === '/houses') {
    _house = { ..._house, ...body };
    return ok({ house: _house });
  }
  if (method === 'post' && url === '/houses/leave') {
    _house = null; return ok({ success: true });
  }
  if (method === 'get' && url === '/houses/members') return ok({ members: _house?.members || [] });
  if (method === 'delete' && /^\/houses\/members\//.test(url)) {
    const memberId = url.split('/').pop();
    if (_house) _house.members = _house.members.filter(m => m.id !== memberId && m.user_id !== memberId);
    return ok({ success: true });
  }

  // ── Rules ──────────────────────────────────────────────────────────────────
  if (method === 'get' && url === '/houses/rules') return ok({ rules: _rules });
  if (method === 'post' && url === '/houses/rules') {
    const rule = { id: nextId('rule'), text: body.text || body.title || body.description || '', house_id: 'house-1' };
    _rules.push(rule); return created({ rule });
  }
  if (method === 'put' && /^\/rules\//.test(url)) {
    const ruleId = url.split('/').pop(); const idx = _rules.findIndex(r => r.id === ruleId);
    if (idx === -1) notFound(); _rules[idx] = { ..._rules[idx], text: body.text || _rules[idx].text }; return ok({ rule: _rules[idx] });
  }
  if (method === 'delete' && /^\/rules\//.test(url)) {
    const ruleId = url.split('/').pop(); _rules = _rules.filter(r => r.id !== ruleId); return ok({ success: true });
  }

  // ── Expenses ───────────────────────────────────────────────────────────────
  if (method === 'get' && /^\/expenses\/[^/]+\/history$/.test(url)) {
    const id = url.split('/')[2];
    return ok({ history: _expenseHistory.filter(h => h.expenseId === id) });
  }
  if (method === 'get' && /^\/expenses(\?.*)?$/.test(url)) {
    return ok({ expenses: _expenses });
  }
  if (method === 'get' && /^\/expenses\/[^/]+$/.test(url) && !url.includes('/balances')) {
    const { id } = param(url, '/expenses/:id');
    const exp = _expenses.find(e => e.id === id);
    if (!exp) notFound();
    return ok({ expense: exp });
  }
  if (method === 'post' && url === '/expenses') {
    const newExp = {
      id: nextId('exp'), title: body.title, amount: parseFloat(body.amount) || 0,
      category: body.category || 'Other', paid_by: _user.id, paidBy: _user,
      splits: body.splits || [{ user: _user, user_id: _user.id, amount: parseFloat(body.amount) || 0, settled: true }],
      createdAt: new Date().toISOString(), note: body.note || '', house_id: 'house-1',
    };
    _expenses.unshift(newExp);
    _expenseHistory.unshift({ id: nextId('ehist'), expenseId: newExp.id, action: 'created', changedBy: _user, timestamp: new Date().toISOString(), note: 'Expense created' });
    return created({ expense: newExp });
  }
  if (method === 'put' && /^\/expenses\/[^/]+$/.test(url)) {
    const id = url.split('/').pop(); const idx = _expenses.findIndex(e => e.id === id);
    if (idx === -1) notFound();
    const prev = { ..._expenses[idx] };
    _expenses[idx] = { ..._expenses[idx], ...body };
    _expenseHistory.unshift({ id: nextId('ehist'), expenseId: id, action: 'updated', changedBy: _user, timestamp: new Date().toISOString(), note: `Title: ${prev.title} → ${_expenses[idx].title}` });
    return ok({ expense: _expenses[idx] });
  }
  if (method === 'delete' && /^\/expenses\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    const exp = _expenses.find(e => e.id === id);
    _expenses = _expenses.filter(e => e.id !== id);
    if (exp) _expenseHistory.unshift({ id: nextId('ehist'), expenseId: id, action: 'deleted', changedBy: _user, timestamp: new Date().toISOString(), note: `Deleted: ${exp.title}` });
    return ok({ success: true });
  }

  // ── Balances ───────────────────────────────────────────────────────────────
  if (url.includes('/balances')) return ok({ balances: _balances });
  if (method === 'post' && url.includes('/settle')) return ok({ balances: _balances });

  // ── Chores ─────────────────────────────────────────────────────────────────
  if (method === 'get' && url === '/chores') return ok(_chores);
  if (method === 'get' && url === '/chores/history') return ok(_history);
  if (method === 'get' && /^\/chores\/[^/]+\/history$/.test(url)) {
    const id = url.split('/')[2]; return ok(_history.filter(h => h.choreId === id));
  }
  if (method === 'get' && /^\/chores\/[^/]+$/.test(url)) {
    const id = url.split('/').pop(); const chore = _chores.find(c => c.id === id);
    if (!chore) notFound(); return ok(chore);
  }
  if (method === 'post' && url === '/chores') {
    const members = _house?.members || [];
    const assigneeId = body.assigned_to || body.assignedTo || _user.id;
    const assignee = members.find(m => m.user_id === assigneeId || m.user?.id === assigneeId)?.user || _user;
    const dueDate = body.due_date || body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString();
    const newChore = {
      id: nextId('chore'), title: body.title, description: body.description || '',
      assignedTo: assignee, assigned_to: assigneeId,
      dueDate, due_date: dueDate,
      completed: false, priority: body.priority || 'medium',
      recurring: body.frequency || body.recurring || 'none', house_id: 'house-1',
      createdAt: new Date().toISOString(),
    };
    _chores.unshift(newChore); return created(newChore);
  }
  if (method === 'put' && /^\/chores\/[^/]+$/.test(url)) {
    const id = url.split('/').pop(); const idx = _chores.findIndex(c => c.id === id);
    if (idx === -1) notFound();
    _chores[idx] = { ..._chores[idx], ...body };
    _history.unshift({ id: nextId('hist'), choreId: id, action: 'edited', title: _chores[idx].title, changedBy: _user, completedAt: new Date().toISOString() });
    return ok(_chores[idx]);
  }
  if (method === 'delete' && /^\/chores\/[^/]+$/.test(url)) {
    const id = url.split('/').pop(); _chores = _chores.filter(c => c.id !== id); return ok({ success: true });
  }
  if (method === 'post' && /^\/chores\/[^/]+\/complete$/.test(url)) {
    const id = url.split('/')[2]; const idx = _chores.findIndex(c => c.id === id);
    if (idx !== -1) { _chores[idx] = { ..._chores[idx], completed: true, completedAt: new Date().toISOString() }; }
    _history.unshift({ id: nextId('hist'), choreId: id, title: _chores[idx]?.title, completedBy: _user, completedAt: new Date().toISOString() });
    return ok(_chores[idx]);
  }

  // ── Announcements ──────────────────────────────────────────────────────────
  if (method === 'get' && url === '/announcements') return ok(_announcements);
  if (method === 'post' && url === '/announcements') {
    const ann = { id: nextId('ann'), title: body.title, message: body.message, postedBy: _user, posted_by: _user.id, pinned: body.pinned || false, createdAt: new Date().toISOString(), house_id: 'house-1' };
    _announcements.unshift(ann); return created(ann);
  }
  if (method === 'delete' && /^\/announcements\//.test(url)) {
    const id = url.split('/').pop(); _announcements = _announcements.filter(a => a.id !== id); return ok({ success: true });
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  if (method === 'get' && url === '/notifications') return ok({ notifications: _notifications });
  if (method === 'put' && /\/notifications\//.test(url)) {
    const id = url.split('/').pop(); const idx = _notifications.findIndex(n => n.id === id);
    if (idx !== -1) _notifications[idx].read = true; return ok({ success: true });
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  console.warn('[MockAPI] Unhandled route:', method.toUpperCase(), url);
  return ok({});
}

// ── Detect if a request should fall through to mock data ────────────────────
export function isNetworkError(error) {
  // Any error with no server response is a network/connectivity failure.
  // This covers: ECONNREFUSED, ENOTFOUND, Android cleartext blocks,
  // React Native "Network request failed", axios timeouts, etc.
  if (!error.response) return true;
  // Also mock when the response looks like it's from the wrong server:
  // 404 = endpoint doesn't exist on whatever is running on that port
  // 5xx = server error from wrong backend
  if (error.response.status === 404) return true;
  if (error.response.status >= 500) return true;
  // HTML response = wrong server (our API always returns JSON)
  const ct = error.response.headers?.['content-type'] || '';
  if (ct.includes('text/html')) return true;
  return false;
}
