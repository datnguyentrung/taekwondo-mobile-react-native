import { hasAnyRole, hasRole, normalizeRole } from './roleAuthorization';

it('normalizes Spring Security role prefixes', () => {
  expect(normalizeRole('COACH')).toBe('ROLE_COACH');
  expect(hasRole(['ROLE_COACH'], 'COACH')).toBe(true);
  expect(hasAnyRole(['ROLE_STUDENT'], ['MANAGER', 'STUDENT'])).toBe(true);
});
