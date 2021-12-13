import { AxiosCacheConfig } from '.';

export interface CacheItem {
  [key: string]: unknown;
  invalidation: number;
  version: string;
  invalidator: string;
}

export const validateKey = (
  key: string,
  invalidator: string,
  version: string
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

    if (parsedCache.invalidator !== invalidator) {
      return undefined;
    }

    if (parsedCache.invalidation < Date.now()) {
      return undefined;
    }

    if (parsedCache.version !== version) {
      return undefined;
    }

    return parsedCache;
  } catch (e) {
    console.error(`Invalid cache value for key ${key}`);
    return undefined;
  }
};

export const getLocal = <T>(
  key: string,
  subkey: string,
  config: AxiosCacheConfig
): T | undefined => {
  if (!key) {
    return;
  }
  const rxKey = `${config.prefix}_${key}`;
  const cachedData = validateKey(rxKey, config.invalidator, config.version);
  if (!cachedData) {
    localStorage.removeItem(rxKey);
    return;
  }
  return cachedData[subkey] as T;
};

export const setLocal = (
  key: string,
  subkey: string,
  value: string,
  config: AxiosCacheConfig
): void => {
  if (!key) {
    return;
  }

  const rxKey = `${config.prefix || 'rx'}_${key}`;
  let cachedData: CacheItem = {
    invalidation: Date.now() + config.invalidationMS,
    version: config.version,
    invalidator: config.invalidator,
  };
  cachedData[subkey] = value;

  const existingItem = localStorage.getItem(rxKey);
  if (existingItem) {
    const existingData: CacheItem = JSON.parse(existingItem);
    existingData[subkey] = value;
    cachedData = { ...cachedData, ...existingData };
  }

  localStorage.setItem(rxKey, JSON.stringify(cachedData));
};

export const invalidateCache = (prefix: string) => {
  for (const key in localStorage) {
    key.startsWith(prefix) && localStorage.removeItem(key);
  }
};
