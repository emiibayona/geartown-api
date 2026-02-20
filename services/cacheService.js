class CacheService {
  constructor(maxKeys = 50) {
    // Mapa principal: Key -> Map de parámetros
    this.cache = new Map();
    this.MAX_KEYS = maxKeys; // Límite de "cajones" principales
  }

  // Helper para mover una clave al final (hacerla "reciente")
  _refreshOrder(key) {
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
  }

  // TTL => 1 day => 60*24
  set(key, params, value, ttlMinutes = 1440) {
    if (!this.cache.has(key)) {
      if (this.cache.size >= this.MAX_KEYS) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
        console.warn(
          `Cache límite alcanzado. Eliminando entrada antigua: ${oldestKey}`,
        );
      }
      this.cache.set(key, new Map());
    } else {
      this._refreshOrder(key);
    }

    const subMap = this.cache.get(key);
    const paramKey = JSON.stringify(params);
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    subMap.set(paramKey, { value, expiresAt });
  }

  get(key, params) {
    if (!this.cache.has(key)) return null;

    this._refreshOrder(key);

    const subMap = this.cache.get(key);
    const paramKey = JSON.stringify(params);
    const entry = subMap.get(paramKey);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      subMap.delete(paramKey);
      return null;
    }

    return entry.value;
  }

  // TTL => 1 day => 60*24
  async getOrSet(key, params, fetchFunction, ttl = 1440) {
    const value = this.get(key, params);
    if (value) {
      console.log(`[Cache] Hit: ${key}`);
      return value;
    }

    console.log(`[Cache] Miss: ${key}. Fetching from DB...`);
    const result = await fetchFunction();

    // Only cache if there's actually data
    if (result) {
      this.set(key, params, result, ttl);
    }
    return result;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  clearAll() {
    this.cache.clear();
  }
  getCache() {
    return this.cache;
  }
}

module.exports = new CacheService(3600);
// export const CacheService = new CacheService(50);
