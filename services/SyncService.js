const axios = require("axios");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const { sequelize, Card, CardFace, Set } = require("../database");
const { Op } = require("sequelize");
const { chunkArray } = require("../utils/Utils");
// const { sequelize, Card, CardFace } = require("./models"); // Import your models

async function bulkUpsertSets(sets) {
  const transaction = await sequelize.transaction();
  try {
    const mapped = sets.map((setData) => ({
      id: setData.id,
      code: setData.code,
      name: setData.name,
      released_at: setData.released_at,
      set_type: setData.set_type,
      card_count: setData.card_count,
      digital: setData.digital,
      icon_svg_uri: setData.icon_svg_uri,
    }));

    const fieldsToUpdate = Object.keys(Set.getAttributes()).filter(
      (key) => key !== "id",
    );
    await Set.bulkCreate(mapped, {
      updateOnDuplicate: fieldsToUpdate,
      transaction,
    });

    await transaction.commit();
    console.log(`Successfully processed ${sets.length} sets.`);
  } catch (error) {
    await transaction.rollback();
    console.error("Bulk Upsert failed:", error);
    throw error;
  }
}
/**
 * Receives an array of Scryfall card objects and performs a bulk upsert.
 * @param {Array} cardsArray - Raw JSON array from Scryfall API
 */
async function bulkUpsertCards(cardsArray) {
  const transaction = await sequelize.transaction();

  try {
    // 1. Prepare Main Card Data
    const mappedCards = cardsArray.map((card) => ({
      id: card.id,
      oracle_id: card.oracle_id,
      tcgplayer_id: card.tcgplayer_id || null,
      name: card.name,
      lang: card.lang,
      released_at: card.released_at,
      layout: card.layout,
      type_line: card.type_line,
      oracle_text: card.oracle_text || "",
      mana_cost: card.mana_cost || null,
      cmc: card.cmc,
      power: card.power || null,
      toughness: card.toughness || null,
      loyalty: card.loyalty || null,
      colors: card.colors || [],
      color_identity: card.color_identity || [],
      keywords: card.keywords || [],
      set_id: card.set_id,
      set: card.set,
      set_name: card.set_name,
      set_type: card.set_type,
      collector_number: card.collector_number,
      rarity: card.rarity,
      artist: card.artist,
      artist_ids: card.artist_ids || [],
      border_color: card.border_color,
      frame: card.frame,
      reserved: card.reserved,
      booster: card.booster,
      reprint: card.reprint,
      variation: card.variation,
      digital: card.digital,
      promo: card.promo,
      oversized: card.oversized,
      full_art: card.full_art,
      textless: card.textless,
      story_spotlight: card.story_spotlight,
      game_changer: card.game_changer,
      games: card.games,
      finishes: card.finishes,
      legalities: card.legalities,
      image_uris: card.image_uris || null,
      uri: card.uri,
      scryfall_uri: card.scryfall_uri,
      rulings_uri: card.rulings_uri,
      prints_search_uri: card.prints_search_uri,
      related_uris: card.related_uris,
    }));

    // 2. Prepare Faces Data
    const faceRecords = [];
    const cardIds = cardsArray.map((c) => c.id);

    cardsArray.forEach((card) => {
      if (card.card_faces && card.card_faces.length > 0) {
        card.card_faces.forEach((face) => {
          faceRecords.push({
            cardId: card.id, // Foreign Key
            name: face.name,
            mana_cost: face.mana_cost,
            type_line: face.type_line,
            oracle_text: face.oracle_text,
            colors: face.colors,
            power: face.power,
            toughness: face.toughness,
            artist: face.artist,
            artist_id: face.artist_id,
            illustration_id: face.illustration_id,
            image_uris: face.image_uris,
          });
        });
      }
    });

    // 3. Execute Bulk Upsert for Main Cards
    // In SQLite, this translates to: INSERT ... ON CONFLICT(id) DO UPDATE SET ...
    const cardFieldsToUpdate = Object.keys(Card.getAttributes()).filter(
      (key) => key !== "id",
    );

    await Card.bulkCreate(mappedCards, {
      updateOnDuplicate: cardFieldsToUpdate,
      transaction,
    });

    // 4. Update Faces (Delete then Re-insert is the safest bulk update for faces)
    if (cardIds.length > 0) {
      await CardFace.destroy({
        where: { cardId: { [Op.in]: cardIds } },
        transaction,
      });
    }

    if (faceRecords.length > 0) {
      await CardFace.bulkCreate(faceRecords, { transaction });
    }

    await transaction.commit();
    console.log(`Successfully processed ${cardsArray.length} cards.`);
  } catch (error) {
    await transaction.rollback();
    console.error("Bulk Upsert failed:", error);
    throw error;
  }
}

async function syncCore(url, type, func) {
  try {
    const options = {
      headers: { "User-Agent": "GearTownApp/1.0", Accept: "application/json" },
    };
    console.log("Fetching bulk data metadata...");
    let metadata = null;
    switch (type) {
      case "cards":
        metadata = await axios.get(url, options);
        uri = metadata.data.data.find(
          (d) => d.type === "all_cards",
        ).download_uri;

        console.log(`📦 Downloading from: ${downloadUri}`);

        // 2. Setup streaming pipeline
        const pipeline = chain([
          await axios({ url: downloadUri, responseType: "stream" }).then(
            (res) => res.data,
          ),
          parser(),
          streamArray(),
        ]);

        let batch = [];
        const BATCH_SIZE = 500;
        let totalProcessed = 0;

        // 3. Process the stream
        pipeline.on("data", async (data) => {
          batch.push(data.value); // data.value is the raw Card JSON

          if (batch.length >= BATCH_SIZE) {
            pipeline.pause(); // Pause stream to let DB catch up
            try {
              await func(batch);
              totalProcessed += batch.length;
              console.log(`⏳ Progress: ${totalProcessed} cards synced...`);
              batch = []; // Clear batch
              pipeline.resume();
            } catch (err) {
              console.error("❌ Batch failed:", err);
              pipeline.destroy();
            }
          }
        });

        pipeline.on("end", async () => {
          // Process final remaining cards
          if (batch.length > 0) {
            await func(batch);
            totalProcessed += batch.length;
          }
          console.log(`✅ Finished! Total synced: ${totalProcessed} cards.`);
        });

        pipeline.on("error", (err) => {
          console.error("🛑 Stream error:", err);
        });

      // const response = await axios.get(defaultCardsUrl);
      // cards = response.data;

      // console.log(`Syncing ${cards.length} cards to SQLite...`);

      // Using bulkCreate with updateOnDuplicate to handle "Create and Update" logic
      // await bulkUpsertCards(cards);

      case "sets":
        metadata = await axios.get(url, options);

        console.log(metadata);
        const rows = chunkArray(metadata.data.data, 200);
        for (const row of rows) {
          await func(row);
        }
        return { process: rows.length };
      default:
    }

    // const metadata = await axios.get("https://api.scryfall.com/bulk-data");
  } catch (error) {
    console.error("Sync failed:", error.message);
    throw error;
  }
}

async function syncCards() {
  try {
    console.log("Fetching bulk data metadata...");

    // let cards = require("../default-cards3.json");
    return await syncCore(
      "https://api.scryfall.com/bulk-data",
      "cards",
      bulkUpsertCards,
    );
  } catch (error) {
    console.error("Sync failed:", error.message);
    throw error;
  }
}

async function syncSets() {
  try {
    console.log("Fetching sets metadata...");
    return await syncCore(
      "https://api.scryfall.com/sets",
      "sets",
      bulkUpsertSets,
    );
  } catch (error) {
    console.error("Sync failed:", error.message);
    throw error;
  }
}

module.exports = { syncCards, syncSets };
