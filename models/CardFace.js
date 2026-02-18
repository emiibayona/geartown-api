// import { DataTypes, Model } from "sequelize";
// import sequelize from "@/database";

// class CardFace extends Model {}
// CardFace.init(
//   {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     // Card ID is handled by association below
//     name: { type: DataTypes.STRING, allowNull: false },
//     mana_cost: { type: DataTypes.STRING },
//     type_line: { type: DataTypes.STRING },
//     oracle_text: { type: DataTypes.TEXT },
//     colors: { type: DataTypes.ARRAY(DataTypes.STRING(1)) },
//     power: { type: DataTypes.STRING(10) },
//     toughness: { type: DataTypes.STRING(10) },
//     loyalty: { type: DataTypes.STRING(10) },
//     artist: { type: DataTypes.STRING },
//     image_uris: { type: DataTypes.JSONB },
//   },
//   {
//     sequelize,
//     modelName: "card_face",
//     tableName: "card_faces",
//     timestamps: false,
//   },
// );

// CardFace.belongsTo({ foreignKey: "card_id" });

// export default CardFace;
