// // const { DataTypes } = require("sequelize");
// // const sequelize = require("../database");

// // const Card = sequelize.define("Card", {
// //   id: { type: DataTypes.UUID, primaryKey: true }, // Scryfall ID
// //   name: { type: DataTypes.STRING, allowNull: false },
// //   lang: { type: DataTypes.STRING },
// //   released_at: { type: DataTypes.DATEONLY },
// //   uri: { type: DataTypes.STRING },
// //   scryfall_uri: { type: DataTypes.STRING },
// //   layout: { type: DataTypes.STRING },
// //   image_uris: { type: DataTypes.JSON }, // Store as JSON object
// //   mana_cost: { type: DataTypes.STRING },
// //   cmc: { type: DataTypes.FLOAT },
// //   type_line: { type: DataTypes.STRING },
// //   oracle_text: { type: DataTypes.TEXT },
// //   colors: { type: DataTypes.JSON },
// //   set_code: { type: DataTypes.STRING },
// //   set_name: { type: DataTypes.STRING },
// //   rarity: { type: DataTypes.STRING },
// // });

// // module.exports = Card;

// /**
//  * Model: Card
//  * Represents the main card print.
//  */

// // import { DataTypes, Model } from "sequelize";
// // import sequelize from "@/database";
// const { DataTypes, Model } = require("sequelize");
// const sequelize = require("..database");

// class Card extends Model {}
// Card.init(
//   {
//     id: {
//       type: DataTypes.UUID,
//       primaryKey: true,
//       defaultValue: DataTypes.UUIDV4,
//     },
//     oracle_id: { type: DataTypes.UUID, allowNull: true },
//     name: { type: DataTypes.STRING, allowNull: false },
//     lang: { type: DataTypes.STRING(10) },
//     released_at: { type: DataTypes.DATEONLY },
//     uri: { type: DataTypes.TEXT },
//     scryfall_uri: { type: DataTypes.TEXT },
//     layout: { type: DataTypes.STRING },

//     // IDs for external systems
//     arena_id: { type: DataTypes.INTEGER },
//     mtgo_id: { type: DataTypes.INTEGER },
//     tcgplayer_id: { type: DataTypes.INTEGER },
//     cardmarket_id: { type: DataTypes.INTEGER },

//     // Gameplay fields
//     mana_cost: { type: DataTypes.STRING },
//     cmc: { type: DataTypes.DECIMAL(10, 1) },
//     type_line: { type: DataTypes.STRING },
//     oracle_text: { type: DataTypes.TEXT },
//     power: { type: DataTypes.STRING(10) },
//     toughness: { type: DataTypes.STRING(10) },
//     loyalty: { type: DataTypes.STRING(10) },
//     defense: { type: DataTypes.STRING(10) },

//     // Arrays (Postgres specific - use JSON for MySQL/SQLite)
//     colors: { type: DataTypes.ARRAY(DataTypes.STRING(1)) },
//     color_identity: { type: DataTypes.ARRAY(DataTypes.STRING(1)) },
//     keywords: { type: DataTypes.ARRAY(DataTypes.STRING) },

//     // Print specific fields
//     set_code: { type: DataTypes.STRING(10) },
//     set_name: { type: DataTypes.STRING },
//     collector_number: { type: DataTypes.STRING },
//     rarity: { type: DataTypes.STRING },
//     artist: { type: DataTypes.STRING },
//     flavor_text: { type: DataTypes.TEXT },
//     border_color: { type: DataTypes.STRING },

//     // Nested Objects as JSONB
//     image_uris: { type: DataTypes.JSONB }, // small, normal, large, png, etc.
//     legalities: { type: DataTypes.JSONB }, // standard: 'legal', modern: 'not_legal', etc.
//     prices: { type: DataTypes.JSONB }, // usd, usd_foil, tix, etc.
//     purchase_uris: { type: DataTypes.JSONB },

//     reserved: { type: DataTypes.BOOLEAN, defaultValue: false },
//     booster: { type: DataTypes.BOOLEAN, defaultValue: true },
//     reprint: { type: DataTypes.BOOLEAN, defaultValue: false },
//   },
//   { sequelize, modelName: "card", tableName: "cards", timestamps: true },
// );

// /**
//  * Model: CardFace
//  * For cards with multiple parts (Transform, Split, Flip, Adventure)
//  */

// // Relationships
// Card.hasMany({ foreignKey: "card_id", as: "card_faces" });

// module.exports = Card;
