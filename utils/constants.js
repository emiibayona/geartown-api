const constants = {
  Games: {
    MAGIC: "magic",
    POKEMON: "pokemon",
    YUGIOH: "yugioh",
    RIFTBOUND: "riftbound",
  },
  Languages: Object.freeze({
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Italian: "it",
    Portuguese: "pt",
    Japanese: "ja",
    Korean: "ko",
    Russian: "ru",
  }),
  CARD_TREATMENT: Object.freeze({
    NORMAL: "",
    NORMAL_MANABOX: "normal",
    FOIL: "foil",
    ETCHED: "etched",
  }),
  MTG: {
    COLORS: {
      WHITE: "W",
      BLUE: "U",
      BLACK: "B",
      GREEN: "G",
      RED: "R",
    },
  },
};

module.exports = constants;
