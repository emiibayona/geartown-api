const service = require("../services/CartService");

const controller = {};

controller.getCartOrWishlist = async (req, res) => {
  try {
    const result = await service.get({ ...(req.params || {}), ...(req.query || {}) })
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", ...(err || {}) });
  }
};

controller.create = async (req, res) => {
  try {
    const result = await service.syncUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: 'Failed on action: create', ...(err || {})
    })
  }
}

controller.update = async (req, res) => {
  try {
    const result = await service.update(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) { res.status(500).json({ error: 'Failed on action: update', ...(err || {}) }) }
}
controller.sync = async (req, res) => {
  try {
    const result = await service.syncUser(null, true);
    res.status(200).json(result);
  } catch (err) { res.status(500).json({ error: 'Failed on action: update', ...(err || {}) }) }
}


module.exports = controller;
