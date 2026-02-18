const { Sequelize, DataTypes, Model } = require("sequelize");

let sequelize = null;

// Test the connection
async function connectToDatabase() {
  try {
    // SQLITE
    if (process.env.SQL_TYPE === "sqlite") {
      sequelize = new Sequelize({
        dialect: "sqlite",
        storage: "./mtg_database.sqlite",
        logging: true,
      });
    }

    if (process.env.SQL_TYPE === "mysql") {
      // MYSQL
      sequelize = new Sequelize("geartownDb", "root", "", {
        host: "localhost",
        dialect: "mysql",
        port: process.env.SQL_PORT || 3306,
      });
    }

    // MYSQ TIDB
    if (process.env.SQL_TYPE === "vercel") {
      sequelize = new Sequelize(process.env.TIDB_URL, {
        dialect: "mysql",
        dialectModule: require("mysql2"),
        dialectOptions: {
          ssl: {
            rejectUnauthorized: true,
          },
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
    }
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

connectToDatabase();

class Card extends Model {}
Card.init(
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
  {
    sequelize,
    modelName: "card",
    indexes: [
      { fields: ["name"] }, // Fast search by card name
      { fields: ["oracle_id"] }, // Grouping card prints
      { fields: ["set"] }, // Filtering by set (e.g., 'ONE', 'LTR')
      { fields: ["released_at"] }, // Sorting by newest cards
      { fields: ["cmc"] }, // Filtering by mana value
      { fields: ["rarity"] }, // Filtering by rarity
    ],
  },
);

class CardFace extends Model {}
CardFace.init(
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
  },
  {
    sequelize,
    modelName: "card_face",
    timestamps: false,
    indexes: [
      { fields: ["cardId"] }, // Essential for the .hasMany join performance
    ],
  },
);

// Join
Card.hasMany(CardFace, { as: "card_faces", foreignKey: "cardId" });
CardFace.belongsTo(Card, { foreignKey: "cardId" });

class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    type: {
      type: DataTypes.ENUM("seller", "buyer", "admin"),
      allowNull: false,
    },
  },
  { sequelize, modelName: "user" },
);

class Collection extends Model {}
Collection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    is_public: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: "collection" },
);

// JOIN TABLE: User <-> Collection (Shared access)
class CollectionUsers extends Model {}
CollectionUsers.init(
  {
    // The magic is here:
    // Setting userId to unique: true makes this a 1-to-Many logic
    // while keeping the Many-to-Many structure for the future.
    userId: {
      type: DataTypes.UUID,
      unique: true, // A User can only appear ONCE in this table
    },
    collectionId: {
      type: DataTypes.UUID,
    },
    role: { type: DataTypes.STRING(255), defaultValue: "owner" }, // 'owner', 'editor', 'viewer'
  },
  {
    sequelize,
    modelName: "collection_user",
    indexes: [{ fields: ["userId"] }, { fields: ["collectionId"] }],
  },
);

// JOIN TABLE: Collection <-> Card (The inventory)
class CollectionCards extends Model {}
CollectionCards.init(
  {
    collectionId: { type: DataTypes.UUID, primaryKey: true },
    cardId: { type: DataTypes.UUID, primaryKey: true },
    treatment: {
      type: DataTypes.STRING(255),
      defaultValue: "normal",
      primaryKey: true,
    },
    lang: { type: DataTypes.STRING(255), primaryKey: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
    condition: { type: DataTypes.STRING(255), defaultValue: "Near Mint" },
    acquired_price: { type: DataTypes.FLOAT },
    name: { type: DataTypes.STRING(255), allowNull: true },
    collectionBinderId: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    modelName: "collection_card",
    indexes: [
      { fields: ["collectionId"] },
      { fields: ["cardId"] },
      { fields: ["collectionBinderId"] },
      { fields: ["collectionBinderId", "collectionId"] },
    ],
  },
);

class CollectionBinders extends Model {}
CollectionBinders.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collectionId: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING(255), defaultValue: "" },
  },
  {
    sequelize,
    modelName: "collection_binder",
    indexes: [{ fields: ["collectionId"] }],
  },
);

class Set extends Model {}
Set.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: { type: DataTypes.STRING(255), unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    released_at: { type: DataTypes.DATEONLY },
    set_type: { type: DataTypes.STRING(255) },
    card_count: { type: DataTypes.INTEGER },
    parent_set_code: { type: DataTypes.STRING(255) },
    digital: { type: DataTypes.BOOLEAN },
    nonfoil_only: { type: DataTypes.BOOLEAN },
    foil_only: { type: DataTypes.BOOLEAN },
    scryfall_uri: { type: DataTypes.TEXT },
    icon_svg_uri: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    modelName: "set",
    indexes: [{ fields: ["code"] }, { fields: ["released_at"] }],
  },
);

class Products extends Model {}
Products.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    sold: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.STRING(255) }, // "single", "bundle", "collection", etc.
    image: { type: DataTypes.STRING(255) },
  },
  {
    sequelize,
    modelName: "product",
    indexes: [{ fields: ["name"] }, { fields: ["type"] }],
  },
);

// // Link it to your Card model
// Set.hasMany(Card, { as: "sets", foreignKey: "set_id" });
// Card.belongsTo(Set, { foreignKey: "set_id" });

// // Join
// Card.hasMany(CardFace, { as: "card_faces", foreignKey: "cardId" });
// CardFace.belongsTo(Card, { foreignKey: "cardId" });

// class CollectionSeller extends Model {}
// CollectionSeller.init({
//   collectionId: {
//     type: DataTypes.UUID,
//     primaryKey: true,
//   },
//   cardId: {
//     type: DataTypes.UUID,
//     primaryKey: true,
//   },
// });

// A User can have many Collections, and a Collection can belong to many Users
User.belongsToMany(Collection, { through: CollectionUsers });
Collection.belongsToMany(User, { through: CollectionUsers });

// A Collection can have many Cards, and a Card can be in many Collections
Collection.belongsToMany(Card, {
  through: { model: CollectionCards, unique: false },
});
Card.belongsToMany(Collection, {
  through: { model: CollectionCards, unique: false },
});

// A Collection
// A Collection can have many Cards, and a Card can be in many Collections
Collection.belongsToMany(Card, {
  through: { model: CollectionCards, unique: false },
});

Card.belongsToMany(Collection, {
  through: { model: CollectionCards, unique: false },
});

// Optional: For easier querying, define "Super" Many-to-Many
Collection.hasMany(CollectionCards);
CollectionCards.belongsTo(Collection);
Card.hasMany(CollectionCards);
CollectionCards.belongsTo(Card);

CollectionCards.belongsTo(CollectionBinders);
CollectionBinders.hasMany(CollectionCards);

module.exports = {
  sequelize,
  Set,
  Card,
  CardFace,
  User,
  Collection,
  CollectionCards,
  CollectionUsers,
  CollectionBinders,
  Products,
};
