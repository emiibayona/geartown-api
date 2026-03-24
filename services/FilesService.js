const { put } = require("@vercel/blob");
const sharp = require("sharp");

const service = {};

service.optimizeImages = async (file, raw = false, options = {}) => {
  if (raw) return { buffer: file, name: file.originalname };

  return {
    buffer: await sharp(file.buffer)
      .resize(1200, null, { withoutEnlargement: true }) // Redimensiona max 1200px ancho
      .webp({ quality: 80 }) // Convierte a WebP con 80% de calidad
      .toBuffer(),
    name: file.originalname.replace(/\.[^/.]+$/, "") + ".webp",
    options: {
      contentType: "image/webp",
      addRandomSuffix: options.subfix,
      cacheControlMaxAge: 31536000, // 1 año de caché en el navegador
    },
  };
};

service.uploadImage = async (file, query) => {
  try {
    if (!file) throw "File is required";

    const optimizedFile = await service.optimizeImages(file, false, { subfix: query?.subfix || false });
    const blob = await put(
      `images/${Date.now()}-${optimizedFile.name}`,
      optimizedFile.buffer,
      {
        ...(optimizedFile?.options || {}),
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      },
    );

    return blob;
  } catch (error) {
    return error;
  }
};

module.exports = service;
