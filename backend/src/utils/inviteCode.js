const { query } = require('../models/db');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit O, 0, I, 1 to avoid confusion
const CODE_LENGTH = 6;

/**
 * Generate a random alphanumeric invite code.
 * @param {number} length
 * @returns {string}
 */
const generateCode = (length = CODE_LENGTH) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return code;
};

/**
 * Generate a unique invite code that does not already exist in the houses table.
 * Retries up to maxRetries times.
 *
 * @param {number} maxRetries
 * @returns {Promise<string>}
 */
const generateUniqueInviteCode = async (maxRetries = 10) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateCode();
    const result = await query(
      'SELECT id FROM houses WHERE invite_code = $1',
      [code]
    );
    if (result.rows.length === 0) {
      return code;
    }
  }
  throw new Error('Failed to generate unique invite code after maximum retries');
};

module.exports = { generateCode, generateUniqueInviteCode };
