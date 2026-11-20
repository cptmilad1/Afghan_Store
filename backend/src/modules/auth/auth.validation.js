const { body } = require('express-validator');
const registerValidation = [
  body('full_name').trim().isLength({ min: 2, max: 150 }),
  body('password').isLength({ min: 8, max: 200 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isLength({ min: 7, max: 30 }),
  body('preferred_language').optional().isIn(['prs', 'en', 'ps']),
  body('role').not().exists().withMessage('Role cannot be selected during public registration.'),
];
const loginValidation = [body('identifier').trim().notEmpty(), body('password').notEmpty()];
module.exports = { registerValidation, loginValidation };
