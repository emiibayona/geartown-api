const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./mtg_database.sqlite",
  logging: true,
});

// const sequelize = new Sequelize("gt-railway", "root", "gt-railway-password", {
//   host: "mysql://root:gt-railway-password@mysql.railway.internal:3306/gt-railway",
//   dialect: "mysql", // Specify the dialect as 'mysql'
//   port: 3306,
//   // Optional: other dialectOptions for mysql2
//   // dialectOptions: {
//   //   connectTimeout: 1000,
//   //   ...
//   // },
// });

// const sequelize = new Sequelize(
//   "mysql://root:gt-railway-password@crossover.proxy.rlwy.net:49182/gt-railway",
// );

// Test the connection
async function connectToDatabase() {
  try {
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
    id: { type: DataTypes.UUIDV4, primaryKey: true },
    oracle_id: { type: DataTypes.UUIDV4 },
    multiverse_ids: { type: DataTypes.JSON }, // SQLite handles arrays as JSON strings
    tcgplayer_id: { type: DataTypes.INTEGER },
    cardmarket_id: { type: DataTypes.INTEGER },

    // Identity & Gameplay
    name: { type: DataTypes.STRING, allowNull: false },
    lang: { type: DataTypes.STRING(10) },
    released_at: { type: DataTypes.DATEONLY },
    layout: { type: DataTypes.STRING },
    highres_image: { type: DataTypes.BOOLEAN },
    image_status: { type: DataTypes.STRING },
    cmc: { type: DataTypes.FLOAT },
    type_line: { type: DataTypes.STRING },
    oracle_text: { type: DataTypes.TEXT },
    mana_cost: { type: DataTypes.STRING },
    power: { type: DataTypes.STRING(10) },
    toughness: { type: DataTypes.STRING(10) },
    loyalty: { type: DataTypes.STRING(10) },
    colors: { type: DataTypes.JSON }, // Array
    color_identity: { type: DataTypes.JSON }, // Array
    keywords: { type: DataTypes.JSON }, // Array

    // Print & Set Info
    set_id: { type: DataTypes.UUIDV4 },
    set: { type: DataTypes.STRING(10) },
    set_name: { type: DataTypes.STRING },
    set_type: { type: DataTypes.STRING },
    collector_number: { type: DataTypes.STRING },
    rarity: { type: DataTypes.STRING },
    artist: { type: DataTypes.STRING },
    artist_ids: { type: DataTypes.JSON }, // Array
    border_color: { type: DataTypes.STRING },
    frame: { type: DataTypes.STRING },
    security_stamp: { type: DataTypes.STRING },

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
    name: { type: DataTypes.STRING, allowNull: false },
    mana_cost: { type: DataTypes.STRING },
    type_line: { type: DataTypes.STRING },
    oracle_text: { type: DataTypes.TEXT },
    colors: { type: DataTypes.JSON },
    power: { type: DataTypes.STRING(10) },
    toughness: { type: DataTypes.STRING(10) },
    artist: { type: DataTypes.STRING },
    artist_id: { type: DataTypes.UUIDV4 },
    illustration_id: { type: DataTypes.UUIDV4 },
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
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
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
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
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
      type: DataTypes.UUIDV4,
      unique: true, // A User can only appear ONCE in this table
    },
    collectionId: {
      type: DataTypes.UUIDV4,
    },
    role: { type: DataTypes.STRING, defaultValue: "owner" }, // 'owner', 'editor', 'viewer'
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
    collectionId: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cardId: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
    },
    treatment: {
      type: DataTypes.STRING,
      defaultValue: "normal",
      primaryKey: true,
    },
    lang: { type: DataTypes.STRING, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
    condition: { type: DataTypes.STRING, defaultValue: "Near Mint" },
    acquired_price: { type: DataTypes.FLOAT }, // Helpful for tracking value over time
    name: { type: DataTypes.STRING, allowNull: true },
    collectionBinderId: { type: DataTypes.UUIDV4, allowNull: true },
  },
  {
    sequelize,
    modelName: "collection_card",
    indexes: [
      { fields: ["collectionId"] }, // Speed up fetching a specific user's deck
      { fields: ["cardId"] }, // Speed up checking card global ownership
      { fields: ["binderId"] }, // Speed up checking card by binder
      { fields: ["binderId", "collectionId"] }, // Speed up checking card by binder
    ],
  },
);

class CollectionBinders extends Model {}
CollectionBinders.init(
  {
    id: { type: DataTypes.UUIDV4, primaryKey: true },
    collectionId: { type: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, defaultValue: "" },
  },
  {
    sequelize,
    modelName: "collection_binder",
    indexes: [
      { fields: ["collectionId"] }, // Speed up fetching a specific user's deck
    ],
  },
);

class Set extends Model {}
Set.init(
  {
    id: { type: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(10), unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    released_at: { type: DataTypes.DATEONLY },
    set_type: { type: DataTypes.STRING },
    card_count: { type: DataTypes.INTEGER },
    parent_set_code: { type: DataTypes.STRING(10) },
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
    id: { type: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    sold: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.STRING }, // "single", "bundle", "collection", etc.
    image: { type: DataTypes.STRING },
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
//     type: DataTypes.UUIDV4,
//     primaryKey: true,
//   },
//   cardId: {
//     type: DataTypes.UUIDV4,
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
