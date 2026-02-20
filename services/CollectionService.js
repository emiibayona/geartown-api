const { Languages, CARD_TREATMENT, MTG } = require("../utils/constants");
const {
  sequelize,
  Card,
  CollectionCards,
  Collection,
  CollectionUsers,
  User,
  CardFace,
  CollectionBinders,
} = require("../database");
const { Op, col } = require("sequelize");
const { prefixes, generateKey } = require("../utils/CacheUtils");
const { chunkArray, getBoundaries } = require("../utils/Utils");
const cacheService = require("./CacheService");
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

    const collectionWhere = { collectionId };
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

    let includesOnCard = [{ model: CollectionBinders, required: false }];
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

    return await cacheService.getOrSet(
      generateKey(prefixes.CollectionService, "gcbc", {
        collection: collectionId,
      }),
      { params },
      () =>
        CollectionCards.findAndCountAll({
          ...getBoundaries(params),
          where: collectionWhere,
          order: [
            ["name", "ASC"],
            ["acquired_price", "DESC"],
          ],
          include: includesOnCard,
        }),
    );
  } catch (error) {
    return error;
  }
};

const addRowsToCollection = async (rows, collectionId, binder) => {
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

  const allCardsInCollection = await CollectionCards.findAll({
    where: { collectionId },
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });

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

    // Binder
    // Binder
    // if (binder) {
    //   binder = BinderService.getByCollection();
    // }

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
          const alreadyOnCol = allCardsInCollection.find(
            (x) => x.cardId === card.id && x.treatment === treatment,
          );
          if (!card) {
            summary.notAdded.push(cur);
          } else if (!alreadyOnCol) {
            prev.push({
              collectionId: collectionId,
              cardId: card.id,
              treatment: treatment,
              quantity: parseInt(cur.Count) || 1,
              condition: cur.Condition || "Near Mint",
              acquired_price: parseFloat(cur["Purchase Price"]) || 0,
              lang: Languages[cur.Language],
              name: card.name,
            });
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
        await CollectionCards.bulkCreate(cardsToInsert, {
          transaction,
        });

        await transaction.commit();
        summary.imported = summary.imported + cardsToInsert.length;
      } catch (error) {
        await transaction.rollback();
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

const removeCardsFromCollection = async ({ cart }) => {
  if (!cart) throw "Cartas son requeridas";

  // Improve to generic
  const collectionId = (
    await findCollectionByUser(process.env.MTG_SELLER_EMAIL)
  )?.collectionId;

  if (!collectionId) throw "Collection es requerida";
  const transaction = await sequelize.transaction();
  const cardsProcessed = [];
  try {
    for (const card of JSON.parse(cart)) {
      const collCard = await CollectionCards.findOne({
        where: { collectionId, cardId: card.cardId },
      });

      // Funciona solo si la cantidad a remover es menor  o igual a lo que hay
      // TODO: Improve manejo de remover mas de lo que hay.

      if (collCard) {
        await collCard.decrement({ quantity: card.quantity }, { transaction });
      }
      cardsProcessed.push({ ...card, added: !!collCard });
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

module.exports = {
  findCollectionById,
  addRowsToCollection,
  findCollectionByUser,
  getCardsByCollection,
  removeCardsFromCollection,
};
