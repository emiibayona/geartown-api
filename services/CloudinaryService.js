const cloudinary = require('cloudinary').v2;

const service = {};
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

service.uploadImage = async (file, options = {}) => {
    try {
        const buffer = file;

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto', transformation: [
                        {
                            folder: options.folder,
                            quality: 'auto',
                            fetch_format: 'webp',
                            filename_override: options.name || file.originalname.split('.')[0]
                        }
                    ]
                },
                (error, res) => {
                    if (error) return reject(error);
                    resolve(res);
                }
            );
            streamifier.createReadStream(buffer).pipe(uploadStream);
        });

        return {
            result, // cloudinary response (urls, public_id, etc.)
            url: cloudinary.url(result.public_id, {
                transformation: [
                    {
                        quality: 'auto',
                    },
                    {
                        width: 1200, crop: 'fill', gravity: 'auto', quality: 'auto',
                    }
                ]
            }),
            name: `${options.name || Date.now()}${'.webp'}`,
            options: {
                cacheControlMaxAge: 31536000, // 1 año de caché en el navegador
            },
        };
    } catch (error) {
        console.error('Error optimizando la imagen:', error);
        throw error;
    }
};


module.exports = service;
