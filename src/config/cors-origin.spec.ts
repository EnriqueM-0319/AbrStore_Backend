import { isCorsOriginAllowed } from './cors-origin';

describe('isCorsOriginAllowed', () => {
  it('allows requests without origin', () => {
    expect(isCorsOriginAllowed(undefined, 'https://app.example.com')).toBe(
      true,
    );
  });

  it('allows exact origins from CORS_ORIGIN', () => {
    expect(
      isCorsOriginAllowed(
        'https://staging.example.com',
        'https://app.example.com, https://staging.example.com',
      ),
    ).toBe(true);
  });

  it('allows preview origins by hostname suffix', () => {
    expect(
      isCorsOriginAllowed(
        'https://abr-store-git-feature-user.vercel.app',
        'https://app.example.com',
        '.vercel.app',
      ),
    ).toBe(true);
  });

  it('rejects origins that are not exact matches or preview suffixes', () => {
    expect(
      isCorsOriginAllowed(
        'https://malicious.example.net',
        'https://app.example.com',
        '.vercel.app',
      ),
    ).toBe(false);
  });
});
