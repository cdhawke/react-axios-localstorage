# react-axios-localstorage

## Install

Using npm

```sh
npm install --save react-axios-localstorage
```

Using yarn

```sh
yarn add react-axios-localstorage
```

## Usage

**Important:** Only `axios.get` requests are supported and will be cached.

### Default implementation

This will create a localstorage entry with the cache key `products`, for the endpoint `/api/v1/products`.

```tsx
import useAxiosLocalstorage from 'react-axios-localstorage';

const Component: React.FC<any> = () => {
  const { data, loading } = useAxiosLocalstorage(
    'products',
    'https://mysite.com/api/v1/products'
  );

  if (loading) {
    return <>Loading ...</>;
  }

  return <>{data}</>;
};
```

By default, the query string parameters (if any) are used as a unique invalidator that will cause the cached endpoint to be invalidated.

```tsx
const { data, loading } = useAxiosLocalstorage(
  'products',
  'https://mysite.com/api/v1/products?query=true'
);

// Triggers a network request to refresh the data - invalidating the previously cached `query=true` data
const { data, loading } = useAxiosLocalstorage(
  'products',
  'https://mysite.com/api/v1/products?query=false'
);
```

Advanced configuration can be specified to manually override several different values. See [Configuration](#configuration) for full set of values.

```tsx
const { loggedIn } = useAuthorization();
const { data, loading } = useAxiosLocalstorage(
  'products',
  'https://mysite.com/api/v1/products?query=true',
  {
    invalidator: loggedIn, // Will cause the cache to be invalidated based on the `loggedIn` status in addition to the `query` parameter
    invalidationMS: 10 * 60 * 1000, // 10 minutes
  }
);
```

## Configuration
