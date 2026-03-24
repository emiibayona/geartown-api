const { uploadImage, getImage } = require("../services/FilesService");
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

controller.getImage = async (req, res) => {
  try {
    const blob = await getImage(req.params, req.query);
    res.setHeader('Cache-Control', 'public, s-maxage=31536000, max-age=31536000, immutable');
    res.redirect(blob?.url || blob);
  } catch (error) {
    console.error("Error en el Proxy de imágenes:", error.message);
    res.status(404).send("Imagen no disponible");
  }
};


module.exports = controller;
