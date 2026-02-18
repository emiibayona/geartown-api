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

const mysqlDB = new Sequelize("geartownDb", "root", "", {
  host: "localhost",
  dialect: "mysql", // Specify the dialect as 'mysql'
  port: process.env.SQL_PORT || 3306,
  // Optional: other dialectOptions for mysql2
  // dialectOptions: {
  //   connectTimeout: 1000,
  //   ...
  // },
  logging: false,
});
// const mysqlDB = new Sequelize(
//   "mysql://4MR3bKoscJKP7Pt.root:kKltd8yh42qlMNCp@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test",
//   {
//     logging: false,
//     dialect: "mysql",
//     // IMPORTANTE para Vercel:
//     dialectModule: require("mysql2"),
//     dialectOptions: {
//       ssl: {
//         rejectUnauthorized: true,
//       },
//     },
//     // TiDB suele preferir esto para evitar errores de timeout en Serverless
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000,
//     },
//   },
// );

// 2. Definición mínima del modelo para la migración
// (Usa una definición simplificada pero con los tipos correctos)
const defineCard = (db) => {
  return db.define(
    "card_face",
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      mana_cost: { type: DataTypes.STRING(255) },
      type_line: { type: DataTypes.STRING(255) },
      oracle_text: { type: DataTypes.TEXT },
      colors: { type: DataTypes.JSON },
      power: { type: DataTypes.STRING(255) },
      toughness: { type: DataTypes.STRING(255) },
      artist: { type: DataTypes.STRING(255) },
      artist_id: { type: DataTypes.UUID },
      illustration_id: { type: DataTypes.UUID },
      image_uris: { type: DataTypes.JSON },
      cardId: { type: DataTypes.UUID },
    },
    { timestamps: false },
  );
};

const CardSource = defineCard(sqliteDB);
const CardTarget = defineCard(mysqlDB);

async function migrateCards() {
  try {
    console.log("🚀 Iniciando migración de cartas...");

    // Sincronizar tabla en MySQL
    await mysqlDB.sync();

    // Extraer datos de SQLite

    const chunkSizeManual = 500;
    const cardsCount = await CardSource.count();

    const pages = Math.ceil(cardsCount / chunkSizeManual);

    // const cards = await CardSource.findAll({ raw: true });
    console.log(
      `📦 Pages: ${pages}, Cartas encontradas ${cardsCount} cartas en SQLite.`,
    );

    // Insertar en MySQL en grupos de 500 para evitar timeouts
    // let i = 0;
    for (let i = 0; i < pages; i += 1) {
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
