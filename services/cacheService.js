// const NodeCache = require("node-cache");

// // stdTTL: 3600 (1 hour). checkperiod: 600 (check for expired keys every 10 mins)
// const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// module.exports = cache;

const NodeCache = require("node-cache");

class CacheService {
  constructor(ttlSeconds) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false, // Performance boost: saves memory by not cloning objects
    });
  }

  // The "Magic" Wrapper
  async getOrSet(key, fetchFunction) {
    const value = this.cache.get(key);
    if (value) {
      console.log(`[Cache] Hit: ${key}`);
      return value;
    }

    console.log(`[Cache] Miss: ${key}. Fetching from DB...`);
    const result = await fetchFunction();

    // Only cache if there's actually data
    if (result) {
      this.cache.set(key, result);
    }
    return result;
  }

  del(keys) {
    this.cache.del(keys);
  }

  flush() {
    this.cache.flushAll();
    console.log("[Cache] Database synced. Cache cleared.");
  }
}

// Export a singleton instance (1 hour default TTL)
module.exports = (val = 3600) => new CacheService(3600);
