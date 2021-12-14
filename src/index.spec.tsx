import axios from 'axios';
import useAxiosCache from '.';
import { renderHook } from '@testing-library/react-hooks';

jest.mock('axios');
(axios.get as jest.Mock<unknown>).mockImplementation(() => {
  return { data: 'yay', status: 200 };
});

describe('React Axios Localstorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  it('succeeds', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAxiosCache('key', 'https://myurl.com/endpoint')
    );
    expect(result.current).toEqual({
      data: undefined,
      error: undefined,
      loading: true,
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    await waitForNextUpdate();
    expect(result.current).toEqual({
      data: 'yay',
      error: undefined,
      loading: false,
    });
  });
});
