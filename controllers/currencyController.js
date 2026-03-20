const Currency = require('../models/Currency');

// @desc    Get all currencies
// @route   GET /api/currencies
// @access  Public (Active only) / Admin (All)
exports.getCurrencies = async (req, res) => {
  try {
    let query = {};
    
    // If request doesn't have an admin user in it, only show active currencies
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'active';
    }

    const currencies = await Currency.find(query).sort({ isDefault: -1, code: 1 });

    res.status(200).json({
      success: true,
      count: currencies.length,
      data: currencies
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new currency
// @route   POST /api/currencies
// @access  Protected (Admin)
exports.createCurrency = async (req, res) => {
  try {
    const { code, symbol, exchangeRate, status, isDefault } = req.body;

    // If new currency is default, unset all others
    if (isDefault) {
      await Currency.updateMany({}, { isDefault: false });
    }

    const currency = await Currency.create({
      code,
      symbol,
      exchangeRate,
      status,
      isDefault
    });

    res.status(201).json({
      success: true,
      data: currency
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Currency code already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update currency
// @route   PUT /api/currencies/:id
// @access  Protected (Admin)
exports.updateCurrency = async (req, res) => {
  try {
    let currency = await Currency.findById(req.params.id);

    if (!currency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }

    const { isDefault } = req.body;

    // Handing default switch
    if (isDefault && !currency.isDefault) {
       await Currency.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    } else if (isDefault === false && currency.isDefault) {
       return res.status(400).json({ success: false, message: 'Cannot unset the default currency directly. Set another currency as default instead.'});
    }

    currency = await Currency.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: currency
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Currency code already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete currency
// @route   DELETE /api/currencies/:id
// @access  Protected (Admin)
exports.deleteCurrency = async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);

    if (!currency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }

    if (currency.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete the default currency.' });
    }

    await currency.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
