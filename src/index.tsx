import axios, { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import { getLocal, setLocal } from './localstorage';

export type AxiosCacheConfigProps = Partial<AxiosCacheConfig>;

export interface AxiosCacheConfig {
  invalidator: string;
  bypass: boolean;
  prefix: string;
  version: string;
  invalidationMS: number;
}

export interface AxiosCacheStatus<T> {
  data: T | null;
  loading: boolean;
}

export const defaultConfig: AxiosCacheConfig = {
  invalidator: '',
  bypass: false,
  prefix: 'rx',
  version: (process.env.GITHUB_ACTIONS && process.env.GITHUB_SHA) || '',
  invalidationMS: 5 * 60 * 1000, // 5 minutes
};

export const useAxiosCache = <T,>(
  cacheKey: string,
  url: string,
  config?: AxiosCacheConfigProps,
  axiosConfig?: AxiosRequestConfig<unknown>
): AxiosCacheStatus<T> => {
  const [status, setStatus] = useState<AxiosCacheStatus<T>>({
    data: null,
    loading: true,
  });

  useEffect(() => {
    const mergedConfig = { ...defaultConfig, ...config };
    const controller = new AbortController();
    const cachedData =
      !mergedConfig.bypass && getLocal<T>(cacheKey, url, mergedConfig);
    if (cachedData) {
      setStatus({ data: cachedData, loading: false });
      return;
    }

    (async () => {
      const response = await axios.get(url, {
        ...axiosConfig,
        signal: controller.signal,
      });

      if (response.status > 201) {
        throw response;
      }
      setStatus({ data: response.data, loading: false });

      !mergedConfig.bypass &&
        setLocal(cacheKey, url, response.data, mergedConfig);
    })();

    return () => controller.abort();
  }, [axiosConfig, cacheKey, config, url]);

  return status;
};

export default useAxiosCache;
