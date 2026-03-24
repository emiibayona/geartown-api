module.exports = (sequelize, DataTypes) => {
    return sequelize.define("YugiohCard", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        cardIdYgo: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        typeline: { type: DataTypes.JSON }, // Array
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        humanReadableCardType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        frameType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        race: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        atk: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        def: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        linkval: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        attribute: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        archetype: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ygoprodeck_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        linkmarkers: { type: DataTypes.JSON }, // Array
        card_images: { type: DataTypes.JSON }, // Array
        card_prices: { type: DataTypes.JSON }, // Array
        misc_info: { type: DataTypes.JSON }, // Array
    }, {
        indexes: [
            // 1. Búsqueda por nombre (Indispensable para el buscador)
            {
                unique: false,
                fields: ['name']
            },
            // 2. Filtro rápido por Arquetipo (Ej: "Elemental HERO", "Cyber Dragon")
            {
                unique: false,
                fields: ['archetype']
            },
            // 3. Índice compuesto para filtros avanzados de juego
            // Optimiza búsquedas tipo: Monstruo + Atributo + Nivel
            {
                name: 'cards_stats_filter',
                fields: ['type', 'attribute', 'level']
            },
            // 4. Índice para el tipo de carta (Spell, Trap, Monster)
            {
                unique: false,
                fields: ['humanReadableCardType']
            }
        ]
    });
};