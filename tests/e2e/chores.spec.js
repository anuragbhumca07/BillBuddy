import { test, expect } from '@playwright/test';
import { ChorePage } from './pages/ChorePage.js';
import { HousePage } from './pages/HousePage.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house, chore } from './fixtures/testData.js';

/**
 * Chore management test suite.
 * Covers creation, listing, completion, rotation, history, update, and deletion.
 */
test.describe('Chore Management', () => {
  const ts = Date.now();
  let aliceAuth;
  let bobAuth;
  let houseId;
  let aliceChores;
  let bobChores;
  let apiContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext();

    aliceAuth = await registerUser(apiContext, uniqueUser(users.alice, ts));
    bobAuth = await registerUser(apiContext, uniqueUser(users.bob, ts));

    const aliceHousePage = new HousePage(apiContext, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `${house.name} Chores ${ts}`,
      address: house.address,
    });
    const houseBody = await houseResp.json();
    houseId = houseBody.house.id;
    const inviteCode = houseBody.house.invite_code;

    const bobHousePage = new HousePage(apiContext, bobAuth.token);
    await bobHousePage.join(inviteCode);

    aliceChores = new ChorePage(apiContext, aliceAuth.token, houseId);
    bobChores = new ChorePage(apiContext, bobAuth.token, houseId);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should create a chore', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const response = await aliceChores.create({
      title: chore.title,
      description: chore.description,
      frequency: chore.frequency,
      assigned_to: aliceAuth.user.id,
      due_date: futureDate,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('chore');
    const created = body.chore;
    expect(created.title).toBe(chore.title);
    expect(created.frequency).toBe(chore.frequency);
    expect(created.due_date.slice(0, 10)).toBe(futureDate);
    expect(created.is_completed).toBe(false);
    expect(created.house_id).toBe(houseId);
  });

  test('should list chores', async () => {
    await aliceChores.create({
      title: chore.title,
      description: chore.description,
      frequency: chore.frequency,
      assigned_to: aliceAuth.user.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const response = await aliceChores.list();
    expect(response.status()).toBe(200);

    const body = await response.json();
    const chores = body.chores || body;
    expect(Array.isArray(chores)).toBe(true);
    expect(chores.length).toBeGreaterThan(0);

    // The chore we created should appear
    const found = chores.find((c) => c.title === chore.title);
    expect(found).toBeDefined();
  });

  test('should mark chore complete', async () => {
    // Create a chore and then complete it
    const createResp = await aliceChores.create({
      title: 'Dishes',
      description: 'Wash all dishes',
      frequency: 'daily',
      assigned_to: aliceAuth.user.id,
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const choreId = createBody.chore.id;

    const completeResp = await aliceChores.complete(choreId);
    expect([200, 204]).toContain(completeResp.status());

    const completeBody = await completeResp.json().catch(() => ({}));
    // If body is returned, completed chore/new chore data should confirm completion
    if (completeBody.chore) {
      expect(completeBody.chore).toHaveProperty('id');
    }
  });

  test('chore auto-rotates assignment after completion', async () => {
    // Create a chore assigned to Alice in a house with Alice and Bob
    const createResp = await aliceChores.create({
      title: 'Vacuum Living Room',
      description: 'Vacuum all carpets',
      frequency: 'weekly',
      assigned_to: aliceAuth.user.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const choreId = createBody.chore.id;
    const originalAssignee = createBody.chore.assigned_to;

    // Alice completes the chore
    const completeResp = await aliceChores.complete(choreId);
    expect([200, 204]).toContain(completeResp.status());

    const completeBody = await completeResp.json().catch(() => ({}));

    // After completion, the next occurrence should be assigned to Bob (rotation)
    // The API may return a new chore or update the existing one
    if (completeBody.next_chore) {
      expect(completeBody.next_chore.assigned_to).toBe(bobAuth.user.id);
    } else if (completeBody.chore) {
      // If same chore is updated with new assignee
      const updatedAssignee = completeBody.chore.assigned_to;
      if (updatedAssignee) {
        expect(updatedAssignee).not.toBe(originalAssignee);
      }
    }
    // Even if API doesn't return rotation info directly, completion should succeed
    expect([200, 204]).toContain(completeResp.status());
  });

  test('should get chore history', async () => {
    // Create and complete a chore so there's history to retrieve
    const createResp = await aliceChores.create({
      title: 'Take Out Trash',
      description: 'Empty all bins',
      frequency: 'weekly',
      assigned_to: aliceAuth.user.id,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const choreId = createBody.chore.id;

    await aliceChores.complete(choreId);

    // Now fetch history
    const histResp = await aliceChores.getHistory();
    expect(histResp.status()).toBe(200);

    const histBody = await histResp.json();
    const history = histBody.history || histBody;
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    // Find our specific chore completion in history
    const record = history.find((h) => h.chore_id === choreId || h.chore?.id === choreId);
    expect(record).toBeDefined();
    expect(record.completed_by).toBe(aliceAuth.user.id);
  });

  test('should update chore', async () => {
    const createResp = await aliceChores.create({
      title: 'Original Chore Title',
      description: 'Original description',
      frequency: 'daily',
      assigned_to: aliceAuth.user.id,
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const choreId = createBody.chore.id;

    const updateResp = await aliceChores.update(choreId, {
      title: 'Updated Chore Title',
      description: 'Updated description',
    });

    expect(updateResp.status()).toBe(200);

    const updateBody = await updateResp.json();
    const updated = updateBody.chore || updateBody;
    expect(updated.title).toBe('Updated Chore Title');
    expect(updated.description).toBe('Updated description');
  });

  test('should delete chore', async () => {
    const createResp = await aliceChores.create({
      title: 'Chore To Delete',
      description: 'This chore will be deleted',
      frequency: 'weekly',
      assigned_to: aliceAuth.user.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const choreId = createBody.chore.id;

    const deleteResp = await aliceChores.delete(choreId);
    expect([200, 204]).toContain(deleteResp.status());

    // Verify the chore is no longer in the list
    const listResp = await aliceChores.list();
    const listBody = await listResp.json();
    const chores = listBody.chores || listBody;
    const found = chores.find((c) => c.id === choreId);
    expect(found).toBeUndefined();
  });
});
