import { AxiosCacheConfigProps } from '.';

/**
 * CacheItem represents the structure of an object that
 * will be cached in localstorage. The [key: string]: unknown
 * mapping allows for multiple subkeys to be cached within a top-level
 * cache item. For instance, if there are multiple product ids
 * that should be stored under a top-level 'products' cache.
 *
 * @export
 * @interface CacheItem
 */
export interface CacheItem {
  [key: string]: unknown;
  /**
   * @see AxiosCacheConfigProps
   *
   * @type {number}
   * @memberof CacheItem
   */
  invalidation: number;
  /**
   * @see AxiosCacheConfigProps
   *
   * @type {string}
   * @memberof CacheItem
   */
  version?: string;
  /**
   * @see AxiosCacheConfigProps
   *
   * @type {string}
   * @memberof CacheItem
   */
  invalidator?: string;
}

/**
 * validateKey checks that a given key exists in the cache, and that
 * it satisfies all of the invalidation parameters. If it does, then the
 * item itself is returned, otherwise undefined is returned.
 *
 * @param {string} key the key to be checked in localstorage
 * @param {string} [invalidator] custom invalidator to compare the key's object properties against
 * @param {string} [version] custom version to compare the key's object properties against
 * @return {*}  {(CacheItem | undefined)}
 */
export const validateKey = (
  key: string,
  invalidator?: string,
  version?: string
): CacheItem | undefined => {
  const value = localStorage.getItem(key);
  if (!value) {
    return undefined;
  }
  try {
    const parsedCache: CacheItem = JSON.parse(value);
    if (!parsedCache) {
      return undefined;
    }

    if (invalidator && parsedCache.invalidator !== invalidator) {
      return undefined;
    }

    if (parsedCache.invalidation < Date.now()) {
      return undefined;
    }

    if (version && parsedCache.version !== version) {
      return undefined;
    }

    return parsedCache;
  } catch (e) {
    console.error(`Invalid cache value for key ${key}`);
    return undefined;
  }
};

/**
 * getLocal will attempt to retrieve an item of type @see T
 * stored within the provided key.
 *
 * @template T
 * @param {string} key the main name of the cached item in localstorage
 * @param {string} subkey the object property within the main key to access
 * @param {AxiosCacheConfigProps} config
 * @return {*}  {(T | undefined)}
 */
export const getLocal = <T>(
  key: string,
  subkey: string,
  config: AxiosCacheConfigProps
): T | undefined => {
  if (!key) {
    return;
  }
  const rxKey = `${config.prefix}_${key}`;
  const cachedData = validateKey(rxKey, config?.invalidator, config?.version);
  if (!cachedData) {
    localStorage.removeItem(rxKey);
    return;
  }
  return cachedData[subkey] as T;
};

/**
 * setLocal attempts to store a key[subkey] = value combination
 * within localstorage.
 *
 * @param {string} key the main cache key to store
 * @param {string} subkey a subkey property within the key object
 * @param {string} value the value retrieved from axios to be stringified
 * @param {AxiosCacheConfigProps} config
 * @return {*}  {void}
 */
export const setLocal = (
  key: string,
  subkey: string,
  value: string,
  config: AxiosCacheConfigProps
): void => {
  if (!key) {
    return;
  }

  const rxKey = `${config.prefix || 'rx'}_${key}`;
  let cachedData: CacheItem = {
    invalidation: Date.now() + config.invalidationMS,
  };
  if (config.invalidator) {
    cachedData.invalidator = config.invalidator;
  }
  if (config.version) {
    cachedData.version = config.version;
  }
  cachedData[subkey] = value;

  const existingItem = localStorage.getItem(rxKey);
  if (existingItem) {
    const existingData: CacheItem = JSON.parse(existingItem);
    existingData[subkey] = value;
    cachedData = { ...cachedData, ...existingData };
  }

  localStorage.setItem(rxKey, JSON.stringify(cachedData));
};
