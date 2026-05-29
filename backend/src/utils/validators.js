const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns 400 on failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      details: errors.array(),
    });
  }
  next();
};

// ─── Auth validators ──────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── House validators ─────────────────────────────────────────────────────────
const createHouseRules = [
  body('name').trim().notEmpty().withMessage('House name is required'),
  body('address').optional().trim(),
];

const joinHouseRules = [
  body('invite_code')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Invite code must be 6 characters'),
];

// ─── Expense validators ───────────────────────────────────────────────────────
const createExpenseRules = [
  body('title').trim().notEmpty().withMessage('Expense title is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category').optional().trim(),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('splits')
    .optional()
    .isArray()
    .withMessage('Splits must be an array'),
  body('splits.*.user_id').optional().isUUID().withMessage('Split user_id must be a UUID'),
  body('splits.*.amount').optional().isFloat({ min: 0 }).withMessage('Split amount must be >= 0'),
];

// ─── Chore validators ─────────────────────────────────────────────────────────
const createChoreRules = [
  body('title').trim().notEmpty().withMessage('Chore title is required'),
  body('frequency')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  body('assigned_to').optional().isUUID().withMessage('assigned_to must be a UUID'),
  body('due_date').optional().isISO8601().withMessage('due_date must be a valid ISO 8601 date'),
  body('description').optional().trim(),
];

// ─── Announcement validators ──────────────────────────────────────────────────
const createAnnouncementRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

// ─── Rule validators ──────────────────────────────────────────────────────────
const createRuleRules = [
  body('rule_text').trim().notEmpty().withMessage('Rule text is required'),
];

// ─── UUID param validator ─────────────────────────────────────────────────────
const uuidParam = (paramName) =>
  param(paramName).isUUID().withMessage(`${paramName} must be a valid UUID`);

module.exports = {
  validate,
  registerRules,
  loginRules,
  createHouseRules,
  joinHouseRules,
  createExpenseRules,
  createChoreRules,
  createAnnouncementRules,
  createRuleRules,
  uuidParam,
};
