const AppSettings = require('../models/AppSettings');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await AppSettings.getSingleton();
    res.json({
      success: true,
      data: {
        backlinksMonthlyLimit: settings.backlinksMonthlyLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { backlinksMonthlyLimit } = req.body;

    const update = {};
    if (backlinksMonthlyLimit != null) {
      const n = parseInt(backlinksMonthlyLimit, 10);
      if (isNaN(n) || n < 1 || n > 1000) {
        return res.status(400).json({
          success: false,
          error: { message: 'backlinksMonthlyLimit must be a number between 1 and 1000' },
        });
      }
      update.backlinksMonthlyLimit = n;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid settings provided' },
      });
    }

    const settings = await AppSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: {
        backlinksMonthlyLimit: settings.backlinksMonthlyLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};
