const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
const getBoundaries = (bond) => {
  if (!bond) {
    return { limit: 20, offset: 0, page: 1 };
  }
  return {
    limit: parseInt(bond?.limit || 20),
    offset: parseInt(bond?.offset || 0),
    page: parseInt(bond?.page || 1),
  };
};
const getGame = (req) => req.params.game;
module.exports = { chunkArray, getBoundaries, getGame };
