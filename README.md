# react-axios-localstorage

`react-axios-localstorage` is a simple hook that wraps `axios` and automatically serializes and caches the results in browser localstorage. This package is not designed to be used on the server, but the main functionality is wrapped in `useEffect`, so should be safe to use in the context of `Next.js`. The hook will attempt to read the value from localstorage before subsequent requests, and supports several forms of cache invalidation.

**Important:** Only `axios.get` requests are supported and will be cached.

## Install

> **Prerequisites**: peerDependencies include `axios >= 0.22.0` and `react 16.8.0 || >= 17.0.0`

Using npm

```sh
npm install --save react-axios-localstorage
```

Using yarn

```sh
yarn add react-axios-localstorage
```

## Usage

### Default implementation

This will create a localstorage entry with the cache key `products`, for the endpoint `/api/v1/products`.

```tsx
import useAxiosCache from 'react-axios-localstorage';

const Component: React.FC<any> = () => {
  const { data, error, loading } = useAxiosCache(
    'products',
    'https://mysite.com/api/v1/products'
  );

  if (loading) {
    return <>Loading ...</>;
  }

  if (error) {
    return <>{error}</>;
  }

  return <>{data}</>;
};
```

By default, the query string parameters (if any) are used as a unique invalidator that will cause the cached endpoint to be invalidated.

```tsx
const { data, error, loading } = useAxiosCache(
  'products',
  'https://mysite.com/api/v1/products?query=true'
);

// Triggers a network request to refresh the data - invalidating the previously cached `query=true` data
const { data, error, loading } = useAxiosCache(
  'products',
  'https://mysite.com/api/v1/products?query=false'
);
```

### Custom invalidations

Advanced configuration can be specified to manually override several different values. See [Configuration](#configuration) for full set of values.

```tsx
const { loggedIn } = useAuthorization();
const { previewMode } = useCMSPreviewMode();
const { data, error, loading } = useAxiosCache(
  'products',
  'https://mysite.com/api/v1/products?query=true',
  {
    invalidator: loggedIn, // Will cause the cache to be invalidated based on the `loggedIn` status in addition to the `query` parameter
    invalidationMS: 10 * 60 * 1000, // 10 minutes
    bypass: previewMode, // If previewMode is true, the cache will be bypassed.
    prefix: 'abc', // Produces the cache key 'abc_products'.
    version: process.env.MY_UNIQUE_SHA,
  }
);
```

## Configuration

| Option           | Type      | Default                                                                                                         | Purpose                                                                                                       |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `invalidator`    | `string`  | `undefined` if no query string parameters are provided, otherwise it will use the query string parameter values | Used as a custom field for determining when to refresh the cached localstorage value                          |
| `bypass`         | `boolean` | `false`                                                                                                         | Indicates whether to skip caching and cache checking for an individual request - useful for CMS preview modes |
| `prefix`         | `string`  | `ral`                                                                                                           | Added to the front of each cache key to provide uniqueness                                                    |
| `version`        | `string`  | `process.env.GITHUB_ACTIONS && process.env.GITHUB_SHA`                                                          | Used for version-based invalidations on CI/CD redeploys or releases                                           |
| `invalidationMS` | `number`  | `300000` (5 minutes)                                                                                            | A time in ms after which the cache key will be invalidated                                                    |
