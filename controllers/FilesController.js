const { uploadImage } = require("../services/FilesService");
const controller = {};

controller.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No se subió ninguna imagen");
    const blob = await uploadImage(req.file, req.query);
    res.status(200).json(blob);
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = controller;
