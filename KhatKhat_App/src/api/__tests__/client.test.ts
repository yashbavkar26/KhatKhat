import client from '../client';
import { getAuth } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

describe('API Client Interceptors', () => {
  it('should attach Firebase ID token if user is logged in', async () => {
    const mockToken = 'test-token-123';
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      },
    });

    const config = { headers: {} };
    // @ts-ignore
    const result = await client.interceptors.request.handlers[0].fulfilled(config);

    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('should not attach Authorization header if no user', async () => {
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: null,
    });

    const config = { headers: {} };
    // @ts-ignore
    const result = await client.interceptors.request.handlers[0].fulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});
