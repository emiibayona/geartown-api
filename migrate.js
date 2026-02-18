const { Sequelize, DataTypes, Model } = require("sequelize");

// 1. Configuración de Conexiones
const sqliteDB = new Sequelize({
  dialect: "sqlite",
  storage: "./mtg_database.sqlite", // Tu archivo local
  logging: false,
});

// const mysqlDB = new Sequelize("geartownDb", "root", "", {
//   host: "localhost",
//   dialect: "mysql", // Specify the dialect as 'mysql'
//   port: 3306,
//   // Optional: other dialectOptions for mysql2
//   // dialectOptions: {
//   //   connectTimeout: 1000,
//   //   ...
//   // },
// });

const mysqlDB = new Sequelize(
  "mysql://4MR3bKoscJKP7Pt.root:kKltd8yh42qlMNCp@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test",
  {
    logging: false,
    dialect: "mysql",
    // IMPORTANTE para Vercel:
    dialectModule: require("mysql2"),
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
    // TiDB suele preferir esto para evitar errores de timeout en Serverless
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

// 2. Definición mínima del modelo para la migración
// (Usa una definición simplificada pero con los tipos correctos)
const defineCard = (db) => {
  return db.define(
    "card",
    {
      // Core IDs
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      oracle_id: { type: DataTypes.UUID },
      multiverse_ids: { type: DataTypes.JSON }, // SQLite handles arrays as JSON strings
      tcgplayer_id: { type: DataTypes.INTEGER },
      cardmarket_id: { type: DataTypes.INTEGER },

      // Identity & Gameplay
      name: { type: DataTypes.STRING(255), allowNull: false },
      lang: { type: DataTypes.STRING(255) },
      released_at: { type: DataTypes.DATEONLY },
      layout: { type: DataTypes.STRING(255) },
      highres_image: { type: DataTypes.BOOLEAN },
      image_status: { type: DataTypes.STRING(255) },
      cmc: { type: DataTypes.FLOAT },
      type_line: { type: DataTypes.STRING(255) },
      oracle_text: { type: DataTypes.TEXT },
      mana_cost: { type: DataTypes.STRING(255) },
      power: { type: DataTypes.STRING(255) },
      toughness: { type: DataTypes.STRING(255) },
      loyalty: { type: DataTypes.STRING(255) },
      colors: { type: DataTypes.JSON }, // Array
      color_identity: { type: DataTypes.JSON }, // Array
      keywords: { type: DataTypes.JSON }, // Array

      // Print & Set Info
      set_id: { type: DataTypes.UUID },
      set: { type: DataTypes.STRING(255) },
      set_name: { type: DataTypes.STRING(255) },
      set_type: { type: DataTypes.STRING(255) },
      collector_number: { type: DataTypes.STRING(255) },
      rarity: { type: DataTypes.STRING(255) },
      artist: { type: DataTypes.STRING(255) },
      artist_ids: { type: DataTypes.JSON }, // Array
      border_color: { type: DataTypes.STRING(255) },
      frame: { type: DataTypes.STRING(255) },
      security_stamp: { type: DataTypes.STRING(255) },

      // Booleans / Flags
      reserved: { type: DataTypes.BOOLEAN },
      booster: { type: DataTypes.BOOLEAN },
      reprint: { type: DataTypes.BOOLEAN },
      variation: { type: DataTypes.BOOLEAN },
      digital: { type: DataTypes.BOOLEAN },
      promo: { type: DataTypes.BOOLEAN },
      oversized: { type: DataTypes.BOOLEAN },
      full_art: { type: DataTypes.BOOLEAN },
      textless: { type: DataTypes.BOOLEAN },
      story_spotlight: { type: DataTypes.BOOLEAN },
      game_changer: { type: DataTypes.BOOLEAN },

      // Lists and Blobs
      games: { type: DataTypes.JSON }, // Array: ["paper", "mtgo"]
      finishes: { type: DataTypes.JSON }, // Array: ["nonfoil", "foil"]
      legalities: { type: DataTypes.JSON }, // Object
      image_uris: { type: DataTypes.JSON }, // Object (if single-faced)

      // External Links
      uri: { type: DataTypes.TEXT },
      scryfall_uri: { type: DataTypes.TEXT },
      rulings_uri: { type: DataTypes.TEXT },
      prints_search_uri: { type: DataTypes.TEXT },
      related_uris: { type: DataTypes.JSON },
    },
    { timestamps: false },
  );
};

const CardSource = defineCard(sqliteDB);
const CardTarget = defineCard(mysqlDB);

async function migrateCards2() {
  // const cards = await CardSource.count({ raw: true, limit: 10 });
  const chunkSizeManual = 5;
  // const cardsCount = await CardSource.count();
  const cardsCount = 20;

  const pages = Math.ceil(cardsCount / chunkSizeManual);
  // const i = 1;
  // const cards = await CardSource.findAll({
  //   raw: true,
  //   limit: chunkSizeManual,
  //   offset: i * chunkSizeManual,
  // });
  // console.log(cards.map((x) => x.name));
  for (let i = 0; i < pages; i += 1) {
    // const chunk = cards.slice(i, i + chunkSize);

    const cards = await CardSource.findAll({
      raw: true,
      limit: chunkSizeManual,
      offset: i * chunkSizeManual,
    });
    console.log(cards.map((x) => x.name));
  }
  console.log(
    "----------",
    (
      await CardSource.findAll({
        raw: true,
        limit: cardsCount,
      })
    ).map((x) => x.name),
  );
}
// migrateCards2();
async function migrateCards() {
  try {
    console.log("🚀 Iniciando migración de cartas...");

    // Sincronizar tabla en MySQL
    await mysqlDB.sync();

    // Extraer datos de SQLite

    const chunkSizeManual = 1000;
    const cardsCount = await CardSource.count();

    const pages = Math.ceil(cardsCount / chunkSizeManual);

    // const cards = await CardSource.findAll({ raw: true });
    console.log(
      `📦 Pages: ${pages}, Cartas encontradas ${cardsCount} cartas en SQLite.`,
    );

    // Insertar en MySQL en grupos de 500 para evitar timeouts
    for (let i = 181000 / chunkSizeManual; i < pages; i += 1) {
      const cards = await CardSource.findAll({
        raw: true,
        limit: chunkSizeManual,
        offset: i * chunkSizeManual,
      });

      // Tratamiento de JSON: SQLite a veces devuelve strings en lugar de objetos
      const parsedChunk = cards.map((card) => ({
        ...card,
        colors:
          typeof card.colors === "string"
            ? JSON.parse(card.colors)
            : card.colors,
        image_uris:
          typeof card.image_uris === "string"
            ? JSON.parse(card.image_uris)
            : card.image_uris,
      }));

      await CardTarget.bulkCreate(parsedChunk, { ignoreDuplicates: true });
      console.log(
        `✅ Migradas ${(i + 1) * parsedChunk.length} / ${cardsCount}...`,
      );
    }

    console.log("✨ ¡Migración de Cards terminada!");
  } catch (error) {
    console.error("❌ Error migrando cartas:", error);
  } finally {
    await sqliteDB.close();
    await mysqlDB.close();
  }
}

migrateCards();
