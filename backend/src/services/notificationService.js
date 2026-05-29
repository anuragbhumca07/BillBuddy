const axios = require('axios');
const { query } = require('../models/db');

const EXPO_PUSH_URL = process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send';

/**
 * Create a notification record in the database.
 *
 * @param {string} userId
 * @param {string} type
 * @param {string} message
 * @returns {Promise<Object>} The created notification record
 */
const createNotification = async (userId, type, message) => {
  const result = await query(
    `INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, false, NOW())
     RETURNING *`,
    [userId, type, message]
  );
  return result.rows[0];
};

/**
 * Send an Expo push notification to a device.
 *
 * @param {string} pushToken - Expo push token (e.g. ExponentPushToken[xxx])
 * @param {string} title
 * @param {string} body
 * @param {Object} data - additional payload
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    return; // not a valid Expo token
  }

  try {
    const payload = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await axios.post(EXPO_PUSH_URL, payload, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (response.data?.data?.status === 'error') {
      console.warn('Expo push error:', response.data.data.message);
    }
  } catch (err) {
    // Non-fatal: log but do not propagate
    console.error('Failed to send push notification:', err.message);
  }
};

/**
 * Notify all members of a house (except optionally one user).
 *
 * @param {string} houseId
 * @param {string} type
 * @param {string} message
 * @param {string} [excludeUserId]
 */
const notifyHouseMembers = async (houseId, type, message, excludeUserId = null) => {
  try {
    const membersResult = await query(
      `SELECT u.id, u.push_token
       FROM house_members hm
       JOIN users u ON u.id = hm.user_id
       WHERE hm.house_id = $1`,
      [houseId]
    );

    const promises = membersResult.rows
      .filter((member) => member.id !== excludeUserId)
      .map(async (member) => {
        await createNotification(member.id, type, message);
        if (member.push_token) {
          await sendPushNotification(member.push_token, 'BillBuddy', message, { type });
        }
      });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('notifyHouseMembers error:', err.message);
  }
};

/**
 * Notify a specific user.
 *
 * @param {string} userId
 * @param {string} type
 * @param {string} message
 * @param {string} [pushToken]
 */
const notifyUser = async (userId, type, message, pushToken = null) => {
  try {
    await createNotification(userId, type, message);

    if (pushToken) {
      await sendPushNotification(pushToken, 'BillBuddy', message, { type });
    } else {
      // Look up push token if not provided
      const result = await query('SELECT push_token FROM users WHERE id = $1', [userId]);
      if (result.rows[0]?.push_token) {
        await sendPushNotification(result.rows[0].push_token, 'BillBuddy', message, { type });
      }
    }
  } catch (err) {
    console.error('notifyUser error:', err.message);
  }
};

module.exports = { createNotification, sendPushNotification, notifyHouseMembers, notifyUser };
