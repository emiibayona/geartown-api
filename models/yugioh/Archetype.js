module.exports = (sequelize, DataTypes) => {
    return sequelize.define("YugiohCardArchetype", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        archetype_name: { type: DataTypes.STRING(255) },
    })
}