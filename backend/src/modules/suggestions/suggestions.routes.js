const router = require('express').Router();
const { query } = require('../../config/db.config');

// Only public city names from approved seller profiles are exposed; no user address data is returned.
router.get('/cities', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 80);
    if (search.length < 2) return res.json({ success: true, data: { items: [] } });
    const { rows } = await query(
      `SELECT DISTINCT city AS value FROM seller_profiles
       WHERE approval_status = 'approved' AND city IS NOT NULL AND city ILIKE $1
       ORDER BY city LIMIT 8`,
      [`%${search}%`],
    );
    return res.json({ success: true, data: { items: rows } });
  } catch (error) { return next(error); }
});

module.exports = router;
