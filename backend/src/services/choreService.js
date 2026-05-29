const cron = require('node-cron');
const { query } = require('../models/db');
const { notifyUser, notifyHouseMembers } = require('./notificationService');

/**
 * Check for chores due tomorrow and create notification records.
 * Runs daily at 8:00 AM.
 */
const checkDueTomorrowChores = async () => {
  console.log('[ChoreService] Checking chores due tomorrow...');
  try {
    const result = await query(
      `SELECT c.id, c.title, c.house_id, c.assigned_to, c.due_date,
              u.push_token, u.name AS assignee_name
       FROM chores c
       LEFT JOIN users u ON u.id = c.assigned_to
       WHERE c.is_completed = false
         AND c.due_date::date = (CURRENT_DATE + INTERVAL '1 day')::date`,
      []
    );

    for (const chore of result.rows) {
      const message = chore.assigned_to
        ? `Reminder: "${chore.title}" is due tomorrow!`
        : `House chore "${chore.title}" is due tomorrow — make sure someone takes care of it!`;

      if (chore.assigned_to) {
        await notifyUser(chore.assigned_to, 'chore_reminder', message, chore.push_token);
      } else {
        await notifyHouseMembers(chore.house_id, 'chore_reminder', message);
      }
    }

    console.log(`[ChoreService] Sent reminders for ${result.rows.length} chore(s)`);
  } catch (err) {
    console.error('[ChoreService] checkDueTomorrowChores error:', err.message);
  }
};

/**
 * Send a weekly chore summary to all houses.
 * Runs every Monday at 8:00 AM.
 */
const sendWeeklyChoreSummary = async () => {
  console.log('[ChoreService] Sending weekly chore summaries...');
  try {
    // Get all houses
    const housesResult = await query('SELECT id, name FROM houses', []);

    for (const house of housesResult.rows) {
      const choresResult = await query(
        `SELECT title, frequency, is_completed, assigned_to,
                u.name AS assignee_name
         FROM chores c
         LEFT JOIN users u ON u.id = c.assigned_to
         WHERE c.house_id = $1
         ORDER BY is_completed ASC, due_date ASC`,
        [house.id]
      );

      const total     = choresResult.rows.length;
      const completed = choresResult.rows.filter((c) => c.is_completed).length;
      const pending   = total - completed;

      const message = `Weekly chore update for ${house.name}: ${completed} done, ${pending} pending.`;
      await notifyHouseMembers(house.id, 'weekly_summary', message);
    }

    console.log(`[ChoreService] Sent weekly summaries for ${housesResult.rows.length} house(s)`);
  } catch (err) {
    console.error('[ChoreService] sendWeeklyChoreSummary error:', err.message);
  }
};

/**
 * Register all cron jobs.
 * Call once during server startup.
 */
const startCronJobs = () => {
  // Daily at 8:00 AM
  cron.schedule('0 8 * * *', checkDueTomorrowChores, {
    timezone: 'America/New_York',
  });

  // Every Monday at 8:00 AM
  cron.schedule('0 8 * * 1', sendWeeklyChoreSummary, {
    timezone: 'America/New_York',
  });

  console.log('[ChoreService] Cron jobs registered');
};

module.exports = { startCronJobs, checkDueTomorrowChores, sendWeeklyChoreSummary };
