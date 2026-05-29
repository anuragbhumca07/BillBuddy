import { test, expect } from '@playwright/test';
import { HousePage } from './pages/HousePage.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house } from './fixtures/testData.js';

/**
 * House management test suite.
 * Covers creation, joining via invite code, member listing, and member removal.
 */
test.describe('House Management', () => {
  const ts = Date.now();
  let aliceAuth;
  let bobAuth;
  let carolAuth;

  test.beforeAll(async ({ request }) => {
    // Register Alice (will be admin)
    aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    // Register Bob and Carol for joining tests
    bobAuth = await registerUser(request, uniqueUser(users.bob, ts));
    carolAuth = await registerUser(request, uniqueUser(users.carol, ts));
  });

  /** Shared state: created house & its invite code */
  let createdHouseId;
  let inviteCode;

  test('should create a house', async ({ request }) => {
    const alicePage = new HousePage(request, aliceAuth.token);
    const response = await alicePage.create({
      name: house.name,
      address: house.address,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('house') ;
    const h = body.house;

    expect(h).toHaveProperty('id');
    expect(h.name).toBe(house.name);
    // Invite code must be exactly 6 characters
    expect(h).toHaveProperty('invite_code');
    expect(h.invite_code.length).toBe(6);

    // Store for subsequent tests
    createdHouseId = h.id;
    inviteCode = h.invite_code;

    // Alice should appear as admin in the members list
    const membersResp = await alicePage.listMembers(createdHouseId);
    expect(membersResp.status()).toBe(200);
    const membersBody = await membersResp.json();
    const members = membersBody.members || membersBody;
    const alice = members.find((m) => m.user_id === aliceAuth.user.id || m.id === aliceAuth.user.id);
    expect(alice).toBeDefined();
    expect(alice.role).toBe('admin');
  });

  test('second user joins via invite code', async ({ request }) => {
    // Bob joins using the invite code Alice received
    const bobPage = new HousePage(request, bobAuth.token);
    const joinResp = await bobPage.join(inviteCode);

    expect(joinResp.status()).toBe(200);

    const joinBody = await joinResp.json();
    expect(joinBody).toHaveProperty('house');
    expect(joinBody.house.id).toBe(createdHouseId);

    // Verify Bob appears in the members list
    const alicePage = new HousePage(request, aliceAuth.token);
    const membersResp = await alicePage.listMembers(createdHouseId);
    const membersBody = await membersResp.json();
    const members = membersBody.members || membersBody;

    const bob = members.find((m) => m.user_id === bobAuth.user.id || m.id === bobAuth.user.id);
    expect(bob).toBeDefined();
    expect(bob.role).toBe('member');
  });

  test('should list house members', async ({ request }) => {
    const alicePage = new HousePage(request, aliceAuth.token);
    const membersResp = await alicePage.listMembers(createdHouseId);

    expect(membersResp.status()).toBe(200);

    const body = await membersResp.json();
    const members = body.members || body;

    expect(Array.isArray(members)).toBe(true);
    // Both Alice and Bob should be present
    const ids = members.map((m) => m.user_id || m.id);
    expect(ids).toContain(aliceAuth.user.id);
    expect(ids).toContain(bobAuth.user.id);
  });

  test('admin can remove member', async ({ request }) => {
    // Carol joins first
    const carolPage = new HousePage(request, carolAuth.token);
    await carolPage.join(inviteCode);

    // Confirm Carol is in members
    const alicePage = new HousePage(request, aliceAuth.token);
    const beforeResp = await alicePage.listMembers(createdHouseId);
    const beforeBody = await beforeResp.json();
    const beforeMembers = beforeBody.members || beforeBody;
    const carolBefore = beforeMembers.find(
      (m) => m.user_id === carolAuth.user.id || m.id === carolAuth.user.id
    );
    expect(carolBefore).toBeDefined();

    // Alice (admin) removes Carol
    const removeResp = await alicePage.removeMember(createdHouseId, carolAuth.user.id);
    expect([200, 204]).toContain(removeResp.status());

    // Carol should no longer be in the members list
    const afterResp = await alicePage.listMembers(createdHouseId);
    const afterBody = await afterResp.json();
    const afterMembers = afterBody.members || afterBody;
    const carolAfter = afterMembers.find(
      (m) => m.user_id === carolAuth.user.id || m.id === carolAuth.user.id
    );
    expect(carolAfter).toBeUndefined();
  });

  test('non-admin cannot remove members', async ({ request }) => {
    // Bob (member) tries to remove Alice (admin) — should fail with 403
    const bobPage = new HousePage(request, bobAuth.token);
    const response = await bobPage.removeMember(createdHouseId, aliceAuth.user.id);

    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
