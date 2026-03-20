const express = require('express');
const {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency
} = require('../controllers/currencyController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Note: getCurrencies is open so the frontend can load active currencies,
// but inside getCurrencies it checks if user is admin to return inactive ones too.
// We use a custom middleware stack here to optionally populate req.user but not fail if missing.

// We use a custom auth check inline
// Actually `protect` fails if there's no token. 
// So let's make a generic GET route, and then a protected GET route for admins.
// Or we can just build logic into `auth.js` or just do it inline here.

// But wait, the standard protect middleware blocks without token. Let's just add an optional verification directly in the controller or a tiny middleware here:
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const checkUserOpt = async (req, res, next) => {
  let token;
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch(err) {
      // ignore
    }
  }
  next();
};

router.route('/')
  .get(checkUserOpt, getCurrencies)
  .post(protect, authorize('admin'), createCurrency);

router.route('/:id')
  .put(protect, authorize('admin'), updateCurrency)
  .delete(protect, authorize('admin'), deleteCurrency);

module.exports = router;
