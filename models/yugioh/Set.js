module.exports = (sequelize, DataTypes) => {
    return sequelize.define("YugiohSet", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        set_name: { type: DataTypes.STRING(255) },
        set_code: { type: DataTypes.STRING(255) },
        num_of_cards: { type: DataTypes.STRING(255) },
        tcg_date: { type: DataTypes.DATEONLY },
        set_image: { type: DataTypes.STRING(255) },
    })
};