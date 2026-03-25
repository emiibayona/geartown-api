const { put, head } = require("@vercel/blob");
const { default: axios } = require("axios");
const sharp = require("sharp");
const CardService = require("./CardService");

const service = {};

service.optimizeImages = async (file, raw = false, options = {}) => {
  if (raw) return { buffer: file, name: file.originalname };

  return {
    buffer: await sharp(file.buffer)
      .resize(1200, null, { withoutEnlargement: true }) // Redimensiona max 1200px ancho
      .webp({ quality: 80 }) // Convierte a WebP con 80% de calidad
      .toBuffer(),
    name: (file.originalname || options.name).replace(/\.[^/.]+$/, "") + ".webp",
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

    const optimizedFile = await service.optimizeImages(file, false, { subfix: query?.subfix || false, name: query?.name || null });
    const blob = await put(
      `images/${query?.folder ? query?.folder + '/' : ''}${optimizedFile.name}`,
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

service.getImage = async ({ game, id, folder }, options) => {
  try {
    const remoteUrl = options.url;
    if (!remoteUrl)
      throw "Remote URL is required"

    const fileName = `${id}`;
    let res = null;

    if (!options.skipFirstFetch) {
      res = await CardService.getLocalImage({ game, id });
    }

    if (!res) {
      try {
        const existingBlob = await head(`images/${game}/${folder ? folder + '/' : ''}${fileName}.webp`, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          cache: 'no-store',
          cacheControlMaxAge: 31536000, // 1 año de caché en el navegador
        });
        await CardService.updateLocalImage({ id, game }, existingBlob.url);
        return existingBlob.url;
      } catch (e) {
        console.log(`Descargando imagen nueva: ${id}`);
      }

      const response = await axios.get(remoteUrl, { responseType: 'arraybuffer' });
      res = await service.uploadImage(response.data, { subfix: false, name: fileName, folder: `${game}${folder ? '/' + folder : ''}` });

      await CardService.updateLocalImage({ id, game }, res.url);

    }
    return res;
  } catch (error) {
    return error
  }
}

module.exports = service;
