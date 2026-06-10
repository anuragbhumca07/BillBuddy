import { test, expect } from '@playwright/test';
import { ExpensePage } from './pages/ExpensePage.js';
import { HousePage } from './pages/HousePage.js';
import { get, put } from './helpers/apiHelper.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house } from './fixtures/testData.js';

/**
 * Notification test suite.
 * Tests that notifications are created when house events occur,
 * that they can be marked as read, and that unread counts are accurate.
 */
test.describe('Notifications', () => {

  /**
   * Helper to get all notifications for the authenticated user.
   */
  async function getNotifications(request, token) {
    const resp = await get(request, '/notifications', token);
    const body = await resp.json();
    return { resp, notifications: body.notifications || body };
  }

  /**
   * Helper to mark a notification as read.
   */
  async function markRead(request, token, notificationId) {
    return put(request, `/notifications/${notificationId}/read`, {}, token);
  }

  /**
   * Helper to get the unread notification count for a user.
   */
  async function getUnreadCount(request, token) {
    const resp = await get(request, '/notifications/unread-count', token);
    const body = await resp.json();
    return body.count ?? body.unread_count ?? body.unreadCount ?? 0;
  }

  test('notification created when expense added', async ({ request }) => {
    const ts = Date.now();
    const aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    const bobAuth = await registerUser(request, uniqueUser(users.bob, ts));

    // Set up house
    const aliceHousePage = new HousePage(request, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `${house.name} Notifications ${ts}`,
      address: house.address,
    });
    const houseBody = await houseResp.json();
    const houseId = houseBody.house.id;
    const inviteCode = houseBody.house.invite_code;
    await new HousePage(request, bobAuth.token).join(inviteCode);

    // Capture Bob's notification count before the expense
    const { notifications: before } = await getNotifications(request, bobAuth.token);
    const beforeCount = before.length;

    // Alice adds an expense — Bob should get a notification
    const aliceExp = new ExpensePage(request, aliceAuth.token, houseId);
    await aliceExp.create({
      title: 'Notification Trigger Expense',
      amount: 50.00,
      category: 'Groceries',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Bob fetches notifications — should have at least one more than before
    const { resp: afterResp, notifications: after } = await getNotifications(request, bobAuth.token);
    expect(afterResp.status()).toBe(200);
    expect(after.length).toBeGreaterThan(beforeCount);

    // The newest unread notification should reference an expense event
    const newest = after.find((n) => !n.is_read && (n.type === 'expense' || n.type === 'expense_added'));
    expect(newest).toBeDefined();
    expect(newest.message).toBeTruthy();
  });

  test('mark notification as read', async ({ request }) => {
    const ts = Date.now() + 1000;
    const aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    const bobAuth = await registerUser(request, uniqueUser(users.bob, ts));

    // House setup
    const aliceHousePage = new HousePage(request, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `Read Notification House ${ts}`,
    });
    const houseBody = await houseResp.json();
    const houseId = houseBody.house.id;
    await new HousePage(request, bobAuth.token).join(houseBody.house.invite_code);

    // Create expense to generate a notification for Bob
    const aliceExp = new ExpensePage(request, aliceAuth.token, houseId);
    await aliceExp.create({
      title: 'Read Test Expense',
      amount: 30.00,
      category: 'Other',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Bob gets the notification
    const { notifications } = await getNotifications(request, bobAuth.token);
    const unreadNotification = notifications.find((n) => !n.is_read);
    expect(unreadNotification).toBeDefined();

    const notifId = unreadNotification.id;

    // Mark it as read
    const markResp = await markRead(request, bobAuth.token, notifId);
    expect([200, 204]).toContain(markResp.status());

    // Fetch again and verify it's marked as read
    const { notifications: after } = await getNotifications(request, bobAuth.token);
    const markedNotif = after.find((n) => n.id === notifId);
    expect(markedNotif).toBeDefined();
    expect(markedNotif.is_read).toBe(true);
  });

  test('count unread notifications', async ({ request }) => {
    const ts = Date.now() + 2000;
    const aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    const bobAuth = await registerUser(request, uniqueUser(users.bob, ts));

    // House setup
    const aliceHousePage = new HousePage(request, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `Unread Count House ${ts}`,
    });
    const houseBody = await houseResp.json();
    const houseId = houseBody.house.id;
    await new HousePage(request, bobAuth.token).join(houseBody.house.invite_code);

    const aliceExp = new ExpensePage(request, aliceAuth.token, houseId);

    // Create 3 expenses → 3 notifications for Bob
    for (let i = 0; i < 3; i++) {
      await aliceExp.create({
        title: `Unread Test Expense ${i + 1}`,
        amount: 10.00 + i,
        category: 'Groceries',
        paid_by: aliceAuth.user.id,
        date: new Date().toISOString().split('T')[0],
      });
    }

    // Get all unread notifications for Bob
    const { notifications: allNotifs } = await getNotifications(request, bobAuth.token);
    const unread = allNotifs.filter((n) => !n.is_read);
    expect(unread.length).toBeGreaterThanOrEqual(3);

    // Mark ONE notification as read
    const firstId = unread[0].id;
    await markRead(request, bobAuth.token, firstId);

    // Unread count should now be at least 2 (one less than before)
    const { notifications: updatedNotifs } = await getNotifications(request, bobAuth.token);
    const updatedUnread = updatedNotifs.filter((n) => !n.is_read);
    expect(updatedUnread.length).toBe(unread.length - 1);

    // Verify via the unread-count endpoint (if available)
    const countResp = await get(request, '/notifications/unread-count', bobAuth.token);
    if (countResp.status() === 200) {
      const countBody = await countResp.json();
      const countValue = countBody.count ?? countBody.unread_count ?? countBody.unreadCount;
      expect(Number(countValue)).toBe(updatedUnread.length);
    }
  });
});
