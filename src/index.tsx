import axios, { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import { getLocal, setLocal } from './localstorage';

export type AxiosCacheConfig = Partial<AxiosCacheConfigProps>;

export interface AxiosCacheConfigProps {
  /**
   * invalidator is a unique identifier used for comparison on invocation.
   * If this value differs from what is currently stored in the cache, then the
   * cached value will be invalidated and re-retrieved from the requested endpoint
   * on the next invocation.
   * This is useful in the event that we want to invalidate our cache based on something
   * non-url related, such as logged-in status.
   *
   * @default url.search (query string parameters)
   *
   * @example
   * ```
   * const props = {invalidator: 'custom'}
   * // creates an invalidator for product_custom
   * // if the invalidator or query string params change, then the value will be invalidated
   * // on next request.
   * useAxiosCache('key', 'url?search=product', props)
   * ```
   *
   * @type {string}
   * @memberof AxiosCacheConfigProps
   */
  invalidator?: string;
  /**
   * bypass indicates manual bypassing of the cache.
   * This is useful for instances that you want to ignore cached values, such as
   * when retrieving data from a CMS in preview mode.
   *
   * @default false
   * @type {boolean}
   * @memberof AxiosCacheConfigProps
   */
  bypass: boolean;
  /**
   * prefix is prepended to the front of the `cacheKey` parameter to construct an
   * identifiable cache key
   *
   * @default 'ral'
   *
   * @type {string}
   * @memberof AxiosCacheConfigProps
   */
  prefix: string;
  /**
   * version will cause an invalidation of the cached value if the value changes on
   * subsequent requests. This is useful in a redeployment scenario when you want to
   * make sure the cache is refreshed after a release. When using Github Actions,
   * the value will default to the GITHUB_SHA value.
   *
   * @default process.env.GITHUB_SHA
   *
   * @type {string}
   * @memberof AxiosCacheConfigProps
   */
  version?: string;
  /**
   * invalidationMS is the time in milliseconds after which a cached value should be invalidated
   * and refreshed.
   *
   * @default 300000 // 5 * 60 * 1000 === 5 minutes
   *
   * @type {number}
   * @memberof AxiosCacheConfigProps
   */
  invalidationMS: number;
}

export interface AxiosCacheStatus<T> {
  data: T | null;
  loading: boolean;
}

export const defaultConfig: AxiosCacheConfigProps = {
  bypass: false,
  prefix: 'ral',
  version: process.env.GITHUB_ACTIONS && process.env.GITHUB_SHA,
  invalidationMS: 5 * 60 * 1000, // 5 minutes
};

/**
 * useAxiosCache wraps axios.get for the specified url and @see AxiosRequestConfig
 * It also incorporates localstorage caching based on the provided cacheKey and
 * @see AxiosCacheConfig
 *
 * @example const { data, loading } = useAxiosCache('products', 'https://mysite.com/api/v1/products');
 *
 * @template T
 * @param {string} cacheKey
 * @param {string} url
 * @param {AxiosCacheConfig} [config]
 * @param {AxiosRequestConfig<unknown>} [axiosConfig]
 * @return {*}  {AxiosCacheStatus<T>}
 */
export const useAxiosCache = <T,>(
  cacheKey: string,
  url: string,
  config?: AxiosCacheConfig,
  axiosConfig?: AxiosRequestConfig<unknown>
): AxiosCacheStatus<T> => {
  const [status, setStatus] = useState<AxiosCacheStatus<T>>({
    data: null,
    loading: true,
  });

  // we want to disable exhaustive deps for this useEffect dependency array
  // because in setting the state of the return, we will potentially trigger a
  // re-render which will feed in 'options' again, causing an infinite loop.
  // We intentionally exclude options here to make sure we call axios only once upon
  // initial load, and then subsequently for url updates if necessary.
  useEffect(() => {
    const endpoint = new URL(url);
    const path = endpoint.pathname;

    const params: string[] = [];
    endpoint.searchParams.forEach((_, v) => {
      params.push(v);
    });

    // Merge the configuration together with requested query string
    // parameters in order to generate a unique invalidator value.
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      invalidator: [...params, config?.invalidator].join('_'),
    };

    // see https://axios-http.com/docs/cancellation
    const controller = new AbortController();

    // When intentionally bypassed, we want to ignore cached data.
    const cachedData =
      !mergedConfig.bypass && getLocal<T>(cacheKey, path, mergedConfig);

    // Bypass the axios call when cached data has been retrieved from localstorage.
    if (cachedData) {
      setStatus({ data: cachedData, loading: false });
      return;
    }

    // Make our axios GET request
    (async () => {
      const response = await axios.get(url, {
        ...axiosConfig,
        signal: controller.signal,
      });

      if (response.status > 201) {
        throw response;
      }
      setStatus({ data: response.data, loading: false });

      // When not intentionally bypassed, we want to update the cached data with the response.
      !mergedConfig.bypass &&
        setLocal(cacheKey, path, response.data, mergedConfig);
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return status;
};

/**
 * invalidateCache will use the provided prefix
 * to remove cached items. It will remove ALL items with the
 * prefix
 *
 * @param {string} [prefix] defaults to 'ral'
 */
export const invalidateCache = (prefix?: string) => {
  for (const key in localStorage) {
    key.startsWith(prefix || defaultConfig.prefix) &&
      localStorage.removeItem(key);
  }
};

export default useAxiosCache;
