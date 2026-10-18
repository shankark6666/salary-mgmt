import { safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it('keeps same-site paths', () => {
    expect(safeNextPath('/employees?country=IN')).toBe('/employees?country=IN');
  });

  it.each(['https://evil.example', '//evil.example/path', '/\\evil.example', 'javascript:alert(1)', '', null])(
    'rejects %s',
    (value) => {
      expect(safeNextPath(value)).toBe('/insights');
    },
  );
});
