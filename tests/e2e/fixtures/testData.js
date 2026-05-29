export const users = {
  alice: { name: 'Alice Smith', email: 'alice@test.com', password: 'password123' },
  bob: { name: 'Bob Jones', email: 'bob@test.com', password: 'password123' },
  carol: { name: 'Carol White', email: 'carol@test.com', password: 'password123' },
};

export const house = {
  name: 'Test House',
  address: '123 Main St, Test City, TC 12345',
};

export const expense = {
  title: 'Groceries',
  amount: 60.00,
  category: 'Groceries',
  date: new Date().toISOString().split('T')[0],
};

export const chore = {
  title: 'Clean Kitchen',
  description: 'Wipe counters, clean stove, mop floor',
  frequency: 'weekly',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

/**
 * Generate unique user data using a timestamp suffix to avoid email conflicts
 * between test runs.
 */
export function uniqueUser(base, suffix) {
  const ts = suffix || Date.now();
  return {
    name: `${base.name} ${ts}`,
    email: `${base.email.split('@')[0]}_${ts}@test.com`,
    password: base.password,
  };
}
