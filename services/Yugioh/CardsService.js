const { sequelize, Op } = require("../../database");
const { generateKey, prefixes } = require("../../utils/CacheUtils");
const { getBoundaries } = require("../../utils/Utils");
const cacheService = require("../cacheService");
const filesService = require("../FilesService")

const { yugioh: YugiohModels } = require("../../database");
const service = {};

service.getCards = async (query) => {
    try {
        const boundaries = getBoundaries(query);
        const getAllAndParse = async () => {
            const cardWhere = JSON.parse(query?.cardWhere || "{}");
            const wheres = {};
            if (cardWhere.race) {
                wheres.race = { [Op.or]: cardWhere.race };
            }
            if (cardWhere.type) {
                wheres.type = { [Op.or]: cardWhere.type };
            }
            if (cardWhere.frameType) {
                wheres.frameType = { [Op.or]: cardWhere.frameType };
            }
            if (cardWhere.attribute) {
                wheres.attribute = { [Op.or]: cardWhere.attribute };
            }
            if (query.name) {
                wheres.name = sequelize.where(
                    sequelize.fn("LOWER", sequelize.col("YugiohCard.name")),
                    {
                        [Op.like]: `%${query.name.toLowerCase().trim()}%`,
                    },
                );
            }
            console.log("Yugioh Models", YugiohModels)
            const cards = await YugiohModels?.Card.findAndCountAll({ ...boundaries, where: wheres });
            for (const element of cards?.rows) {
                if (!element.local_url) {
                    const res = await filesService.getImage({ game: query.game, id: element.name, folder: 'new' }, { url: element?.card_images[0]?.image_url, skipFirstFetch: true })
                    element.local_url = res?.url || res;
                }
            }
            return {
                total: cards.count,
                pages: Math.ceil(cards.count / boundaries.limit),
                data: cards.rows,
            };
        }
        return await cacheService.getOrSet(
            generateKey(prefixes.CollectionService, "gcbg"),
            { query },
            () => getAllAndParse(),
        );
    } catch (error) {
        console.log(error)
        return error;
    }
}

module.exports = service;