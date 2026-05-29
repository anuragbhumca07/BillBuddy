import { test, expect } from '@playwright/test';
import { AnnouncementPage } from './pages/AnnouncementPage.js';
import { HousePage } from './pages/HousePage.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house } from './fixtures/testData.js';

/**
 * Announcements and house rules test suite.
 */
test.describe('Announcements & House Rules', () => {
  const ts = Date.now();
  let aliceAuth;
  let bobAuth;
  let houseId;
  let aliceAnnouncements;
  let bobAnnouncements;

  test.beforeAll(async ({ request }) => {
    aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    bobAuth = await registerUser(request, uniqueUser(users.bob, ts));

    const aliceHousePage = new HousePage(request, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `${house.name} Announcements ${ts}`,
      address: house.address,
    });
    const houseBody = await houseResp.json();
    houseId = houseBody.house.id;
    const inviteCode = houseBody.house.invite_code;

    const bobHousePage = new HousePage(request, bobAuth.token);
    await bobHousePage.join(inviteCode);

    aliceAnnouncements = new AnnouncementPage(request, aliceAuth.token, houseId);
    bobAnnouncements = new AnnouncementPage(request, bobAuth.token, houseId);
  });

  // ─── Announcements ─────────────────────────────────────────────────────────

  test('should post announcement', async () => {
    const response = await aliceAnnouncements.createAnnouncement({
      title: 'House Meeting',
      message: 'We will have a house meeting on Friday at 7pm.',
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('announcement');
    const ann = body.announcement;
    expect(ann.title).toBe('House Meeting');
    expect(ann.message).toBe('We will have a house meeting on Friday at 7pm.');
    expect(ann.house_id).toBe(houseId);
    expect(ann.posted_by).toBe(aliceAuth.user.id);
  });

  test('announcement visible to all members', async () => {
    // Alice posts an announcement
    const postResp = await aliceAnnouncements.createAnnouncement({
      title: 'Rent Due',
      message: 'Rent is due on the 1st of next month.',
    });
    const postBody = await postResp.json();
    const announcementId = postBody.announcement.id;

    // Bob (another member) fetches the announcements list
    const listResp = await bobAnnouncements.listAnnouncements();
    expect(listResp.status()).toBe(200);

    const listBody = await listResp.json();
    const announcements = listBody.announcements || listBody;
    expect(Array.isArray(announcements)).toBe(true);

    const found = announcements.find((a) => a.id === announcementId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Rent Due');
    expect(found.message).toBe('Rent is due on the 1st of next month.');
  });

  test('should delete announcement', async () => {
    // Alice posts an announcement to delete
    const postResp = await aliceAnnouncements.createAnnouncement({
      title: 'Temp Announcement',
      message: 'This will be deleted.',
    });
    const postBody = await postResp.json();
    const announcementId = postBody.announcement.id;

    // Delete it
    const deleteResp = await aliceAnnouncements.deleteAnnouncement(announcementId);
    expect([200, 204]).toContain(deleteResp.status());

    // Verify it's no longer visible
    const listResp = await aliceAnnouncements.listAnnouncements();
    const listBody = await listResp.json();
    const announcements = listBody.announcements || listBody;
    const found = announcements.find((a) => a.id === announcementId);
    expect(found).toBeUndefined();
  });

  // ─── House Rules ────────────────────────────────────────────────────────────

  test('should add house rule', async () => {
    const response = await aliceAnnouncements.createRule({
      rule_text: 'No smoking inside the house.',
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('rule');
    const rule = body.rule;
    expect(rule.rule_text).toBe('No smoking inside the house.');
    expect(rule.house_id).toBe(houseId);
    expect(rule.created_by).toBe(aliceAuth.user.id);
  });

  test('should list house rules', async () => {
    // Create a known rule
    const createResp = await aliceAnnouncements.createRule({
      rule_text: 'Clean up after yourself in the kitchen.',
    });
    const createBody = await createResp.json();
    const ruleId = createBody.rule.id;

    const listResp = await aliceAnnouncements.listRules();
    expect(listResp.status()).toBe(200);

    const listBody = await listResp.json();
    const rules = listBody.rules || listBody;
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);

    const found = rules.find((r) => r.id === ruleId);
    expect(found).toBeDefined();
    expect(found.rule_text).toBe('Clean up after yourself in the kitchen.');
  });

  test('should delete house rule', async () => {
    // Create a rule to delete
    const createResp = await aliceAnnouncements.createRule({
      rule_text: 'Rule to be deleted.',
    });
    const createBody = await createResp.json();
    const ruleId = createBody.rule.id;

    // Delete it
    const deleteResp = await aliceAnnouncements.deleteRule(ruleId);
    expect([200, 204]).toContain(deleteResp.status());

    // Verify it's gone from the list
    const listResp = await aliceAnnouncements.listRules();
    const listBody = await listResp.json();
    const rules = listBody.rules || listBody;
    const found = rules.find((r) => r.id === ruleId);
    expect(found).toBeUndefined();
  });
});
