const { Languages, CARD_TREATMENT, MTG } = require("../utils/constants");
const {
  sequelize,
  Card,
  CollectionCards,
  Collection,
  CollectionUsers,
  CardFace,
  BindersCards,
  Binders,
} = require("../database");
const { Op, col, QueryTypes } = require("sequelize");
const { prefixes, generateKey } = require("../utils/CacheUtils");
const { chunkArray, getBoundaries } = require("../utils/Utils");
const cacheService = require("./cacheService");
const BinderService = require("./BinderService");
const userService = require("./UserService");

const findCollectionById = async (id) => {
  if (!id) {
    return "Id is reqired";
  }
  return await Collection.findByPk(id);
};

const findCollectionByUser = async (user) => {
  try {
    const userFound = await userService.findUserByEmail(user);
    if (!userFound) {
      return "User not found";
    }

    return await ensureUserCollection({ user: userFound });
  } catch (error) {
    return error;
  }
};

const getCardsByCollection = async (collectionId, params) => {
  try {
    if (!collectionId) return "Collection Id is required";

    const collectionWhere = { collectionId, quantity: { [Op.gt]: 0 } };
    const cardWhere = JSON.parse(params.cardWhere || "{}");
    const includeCards = params?.cards === "true" ? true : false;

    if (params.name) {
      collectionWhere.name = { [Op.like]: `%${params.name}%` };
    }
    if (params.treatment) {
      collectionWhere.treatment =
        params.treatment === "normal"
          ? { [Op.or]: ["", "etched"] }
          : params.treatment;
    }
    if (cardWhere.type) {
      cardWhere.type_line = {
        [Op.and]: cardWhere.type.map((x) => ({ [Op.like]: `%${x}%` })),
      };
      delete cardWhere.type;
    }
    if (cardWhere?.set === "") {
      delete cardWhere.set;
    }

    if (cardWhere.rarity) {
      cardWhere.rarity = { [Op.or]: cardWhere.rarity };
    }

    if (cardWhere.colors) {
      cardWhere.color_identity = {
        [Op.and]: [
          sequelize.literal(
            `json_array_length(card.color_identity) = ${cardWhere.colors.length}`,
          ),
        ].concat(
          cardWhere.colors.map((x) =>
            sequelize.literal(
              `EXISTS (SELECT 1 FROM json_each(card.color_identity) WHERE value = '${x}')`,
            ),
          ),
        ),
      };
      delete cardWhere.colors;
    }

    // let includesOnCard = [{ model: BindersCards, required: false }];
    let includesOnCard = [];
    if (includeCards) {
      includesOnCard.push({
        model: Card,
        as: "card",
        where: cardWhere,
        attributes: [
          "id",
          "name",
          "image_uris",
          "colors",
          "color_identity",
          "rarity",
          "set",
        ],
        order: [["name", "DESC"]],
        include: [
          {
            model: CardFace,
            required: false,
            as: "card_faces",
            attributes: ["cardId", "image_uris"],
            separate: true,
          },
        ],
      });
    }

    const resolveAll = async () => {
      const boundaries = getBoundaries(params);
      const options = {
        where: collectionWhere,
        order: [
          ["name", "ASC"],
          ["acquired_price", "DESC"],
        ],
        attributes: [
          ...Object.keys(CollectionCards.getAttributes()),
          [sequelize.fn("sum", sequelize.col("quantity")), "quantity"],
        ],
        group: ["cardId"],
        include: includesOnCard,
      };
      const [count, data] = await Promise.all([
        CollectionCards.count({ ...options, attributes: [], include: [] }),
        CollectionCards.findAndCountAll({ ...options, ...boundaries }),
      ]);
      return {
        collectionId,
        total: count.length,
        pages: Math.ceil(count.length / boundaries.limit),
        data: data.rows,
      };
    };

    return await cacheService.getOrSet(
      generateKey(prefixes.CollectionService, "gcbc", {
        collection: collectionId,
      }),
      { params },
      () => resolveAll(),
    );
  } catch (error) {
    return error;
  }
};

const parseCardToInsert = (card, cur, collectionId, treatment) => ({
  collectionId,
  cardId: card.id,
  treatment,
  lang: Languages[cur.Language],
  quantity: parseInt(cur.Count) || 1,
  condition: cur.Condition || "Near Mint",
  acquired_price: parseFloat(cur["Purchase Price"]) || 0,
  name: card.name,
});

const addRowsToCollection = async (rows, collectionId, binder = "default") => {
  if (!rows?.length) {
    return "The collection to add is empty";
  }

  let transaction;

  const summary = {
    imported: 0,
    skipped: 0,
    processed: 0,
    notAdded: [],
    totalCards: 0,
  };

  const BATCH_SIZE = 100;

  rows = rows.reduce((acc, current) => {
    const existing = acc.find(
      (x) =>
        x.Edition === current.Edition &&
        x["Collector Number"] === current["Collector Number"] &&
        (x.Foil || "regular") === (current.Foil || "regular"),
    );

    if (existing) {
      existing.Count =
        (parseInt(existing.Count) || 1) + (parseInt(current.Count) || 1);
    } else {
      acc.push(current);
    }

    summary.totalCards++;
    return acc;
  }, []);

  const chunks = chunkArray(rows, BATCH_SIZE);

  if (binder) {
    const binderFound = await BinderService.getByName(binder, collectionId);

    binder = (
      binderFound
        ? binderFound
        : await BinderService.createBinder({ collectionId, name: binder })
    )?.id;
  }

  for (const chunk of chunks) {
    const rowsFoils = chunk.filter((x) =>
      x.Foil?.toLowerCase().includes(CARD_TREATMENT.FOIL),
    );
    const rowsRegular = chunk.filter(
      (x) => x.Foil?.toLowerCase() === CARD_TREATMENT.NORMAL,
    );
    const rowsEtched = chunk.filter((x) =>
      x.Foil?.toLowerCase().includes(CARD_TREATMENT.ETCHED),
    );
    let allRawCards = [];
    let allRawCardsFoils = [];
    let allRawCardsEtched = [];

    const generateCardOptions = (arr) => ({
      where: {
        [Op.or]: arr.map((x) => ({
          [Op.and]: {
            collector_number: x["Collector Number"],
            set: x.Edition.toLowerCase(),
          },
        })),
      },
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    //  Cards in DB
    if (rowsRegular.length) {
      allRawCards = await Card.findAll(generateCardOptions(rowsRegular));
    }
    if (rowsFoils.length) {
      allRawCardsFoils = await Card.findAll(generateCardOptions(rowsFoils));
    }
    if (rowsEtched.length) {
      allRawCardsEtched = await Card.findAll(generateCardOptions(rowsEtched));
    }

    // End Cards in DB

    const redudu = (ar, arCheck, treatment) =>
      ar.reduce((prev, cur) => {
        const cards = arCheck.filter(
          (x) =>
            x.collector_number === cur["Collector Number"] &&
            cur.Edition.toLowerCase() === x.dataValues.set,
        );
        const card =
          cards.length === 1
            ? cards[0]
            : cards.find((x) => Languages[cur.Language] === x.lang);
        try {
          if (!card) {
            summary.notAdded.push(cur);
          } else {
            prev.push(parseCardToInsert(card, cur, collectionId, treatment));
          }
          return prev;
        } catch (error) {
          throw card;
        }
      }, []);

    const cardsToInsert = redudu(
      rowsRegular,
      allRawCards,
      CARD_TREATMENT.NORMAL,
    )
      .concat(redudu(rowsFoils, allRawCardsFoils, CARD_TREATMENT.FOIL))
      .concat(redudu(rowsEtched, allRawCardsEtched, CARD_TREATMENT.ETCHED));

    if (cardsToInsert.length) {
      transaction = await sequelize.transaction();

      try {
        const createdDate = new Date();
        const values = cardsToInsert
          .map((c) => {
            return `(${[
              sequelize.escape(c.collectionId),
              sequelize.escape(c.cardId),
              sequelize.escape(c.treatment || ""),
              sequelize.escape(c.lang || "en"),
              parseInt(c.quantity) || 0,
              sequelize.escape(c.condition || "Near Mint"),
              parseFloat(c.acquired_price) || 0,
              sequelize.escape(c.name || "Unknown"),
              sequelize.escape(createdDate),
              sequelize.escape(createdDate),
              sequelize.escape(binder),
            ].join(",")})`;
          })
          .join(",");

        let query = null;
        if (["mysql", "vercel"].includes(process.env.SQL_TYPE)) {
          query = `
            INSERT INTO \`collection_cards\` (
              \`collectionId\`, \`cardId\`, \`treatment\`, \`lang\`, 
              \`quantity\`, \`condition\`, \`acquired_price\`, \`name\`, \`createdAt\`, \`updatedAt\`
              ) 
              VALUES ${values}
              ON DUPLICATE KEY UPDATE 
              \`quantity\` = \`quantity\` + VALUES(\`quantity\`),
              \`name\` = VALUES(\`name\`); 
              `;
        } else {
          query = `INSERT INTO collection_cards (collectionId, cardId, treatment, lang, quantity, "condition", acquired_price, name, createdAt, updatedAt, binderId) 
            VALUES ${values}  ON CONFLICT (collectionId, cardId, treatment, lang, "condition", binderId) DO UPDATE SET quantity = collection_cards.quantity + excluded.quantity, updatedAt = ${sequelize.escape(createdDate)};`;
        }
        const res = await sequelize.query(query, {
          transaction,
        });

        await transaction.commit();

        if (binder) {
          // TODO: Pending to mysql
          let insertedCards = await sequelize.query(
            `SELECT id FROM collection_cards
              WHERE createdAt = ${sequelize.escape(createdDate)} OR updatedAt = ${sequelize.escape(createdDate)}`,
            { type: sequelize.QueryTypes.SELECT },
          );

          const result = await BindersCards.findAll({
            where: {
              [Op.or]: insertedCards.map((x) => ({
                binderId: binder,
                collectionCardId: x.id,
              })),
            },
          });

          const newlyAdded = insertedCards.filter(
            (card) => !result.map((r) => r.collectionCardId).includes(card.id),
          );

          await BindersCards.bulkCreate(
            newlyAdded.map((x) => ({
              binderId: binder,
              collectionCardId: x.id,
            })),
          );
        }

        summary.imported = summary.imported + cardsToInsert.length;
      } catch (error) {
        await transaction.rollback();
        console.error("SQL Error:", error.parent.sqlMessage);
        console.error("SQL State:", error.parent.code);
        throw error;
      }
    }
    summary.skipped = summary.skipped + (chunk.length - cardsToInsert.length);
    summary.processed += chunk.length;
    console.log("+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_");
    console.log("+_+_+_+_+_+_+_+_ON EVERY ITERATION+_+_+_+_+_+_+_+_+_+_+_");
    console.log("+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_");
    console.log(`Processed: ${summary.processed}`);
    console.log(
      `Imported: ${summary.imported} --- Skipped: ${summary.skipped}`,
    );
    console.log(`Total: ${summary.skipped + summary.imported}`);

    // Pending to fix
  }

  cacheService.invalidate(
    generateKey(prefixes.CollectionService, "gcbc", {
      collection: collectionId,
    }),
  );
  return summary;
};

const removeCardsFromCollection = async ({ cart, collection = null }) => {
  if (!cart) throw "Cartas son requeridas";

  // Improve to generic
  const collectionId =
    collection ||
    (await findCollectionByUser(process.env.MTG_SELLER_EMAIL))?.collectionId;

  if (!collectionId) throw "Collection es requerida";
  const transaction = await sequelize.transaction();
  const cardsProcessed = [];
  try {
    for (const card of cart) {
      const collCard = await CollectionCards.findOne({
        where: { collectionId, cardId: card.cardId, quantity: [] },
      });

      // Funciona solo si la cantidad a remover es menor  o igual a lo que hay
      // TODO: Improve manejo de remover mas de lo que hay.
      let added = false;
      let error = "";
      const couldSell =
        collCard && card.sold > 0 && collCard.quantity >= card.sold;

      if (couldSell) {
        await collCard.decrement({ quantity: card.sold }, { transaction });
        // TODO: Cascade a binders
        added = true;
      } else {
        error = "Cantidad solicitada mayor a disponible";
      }

      cardsProcessed.push({
        ...card,
        added,
        error,
      });
    }

    await transaction.commit();
    if (cardsProcessed.length) {
      cacheService.invalidate(
        generateKey(prefixes.CollectionService, "gcbc", {
          collection: collectionId,
        }),
      );
    }
    return cardsProcessed;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

async function ensureUserCollection({ user }) {
  try {
    if (!user) {
      // TODO: lazy create acount for later versions
      return "Should ask to create your user to an admin for now";
    } else {
      let link = await CollectionUsers.findOne({
        where: { userId: user.id },
      });

      if (link) {
        return link;
      }

      if (!link) {
        // 2. If it doesn't exist, create it
        const newCollection = await Collection.create({
          name: "My Main Collection",
          description: "Default Binder",
        });

        // 3. Link it
        await CollectionUsers.create({
          userId: user.id,
          collectionId: newCollection.id,
          role: "owner",
        });

        return newCollection;
      }
    }
  } catch (error) {
    return error;
  }
}

async function getBinders(colId) {
  try {
    if (!colId) {
      throw "collection id required";
    }

    return await cacheService.getOrSet(
      generateKey(prefixes.CollectionService, "gbbc", {
        collection: colId,
      }),
      {},
      () => Binders.findAll({ where: { collectionId: colId } }),
    );
  } catch (error) {
    return error;
  }
}

async function createBinder({ collectionId }, params) {
  if (!collectionId) {
    throw "collection id required";
  }
  if (!params.name) {
    throw "collection id required";
  }
  const result = await Binders.create({ collectionId, ...params });

  if (result)
    cacheService.invalidate(
      generateKey(prefixes.CollectionService, "gbbc", {
        collection: params.collectionId,
      }),
      {},
    );
  return result;
}

async function clearCollectionCache() {
  cacheService.clearAll();
}

module.exports = {
  findCollectionById,
  addRowsToCollection,
  findCollectionByUser,
  getCardsByCollection,
  removeCardsFromCollection,
  clearCollectionCache,
  // Binders
  getBinders,
  createBinder,
};
