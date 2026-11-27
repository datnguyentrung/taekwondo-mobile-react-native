import { keyValueStorage } from '@/infrastructure/storage/keyValueStorage';
import { secureStorage } from '@/infrastructure/storage/secureStorage';

import type { AuthSnapshot, AuthTokens } from '../domain/auth.types';

const authStorageKeys = {
  tokens: 'auth.tokens.v2',
  snapshot: 'auth.snapshot.v2',
  migration: 'auth.storage-migration.v2',
} as const;

const legacyAuthKeys = [
  'auth.tokens.v1',
  'auth.snapshot.v1',
  'auth.storage-migration.v1',
  'refreshToken',
  'refresh_token',
  'token',
  'access_token',
  'user',
  'role',
  'idRole',
  'idUser',
  'idAccount',
  'userCode',
  'currentUser',
  'authData',
  'auth-storage',
] as const;

type TokenEnvelope = AuthTokens & { version: 2 };
type SnapshotEnvelope = { version: 2; snapshot: AuthSnapshot };

function normalizeContext(context: AuthSnapshot['activeContext']): AuthSnapshot['activeContext'] {
  return context
    ? {
        ...context,
        gender: context.gender ?? null,
        faceImagePath: context.faceImagePath ?? null,
      }
    : null;
}

function normalizeSnapshot(snapshot: AuthSnapshot): AuthSnapshot {
  return {
    ...snapshot,
    activeTenant: snapshot.activeTenant ?? null,
    availableTenants: snapshot.availableTenants ?? [],
    requiresTenantSelection: snapshot.requiresTenantSelection ?? !snapshot.activeTenant,
    activeContext: normalizeContext(snapshot.activeContext),
    availableContexts: snapshot.availableContexts.map((context) =>
      normalizeContext(context)!,
    ),
  };
}

function isTokenEnvelope(value: unknown): value is TokenEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<TokenEnvelope>;
  return (
    envelope.version === 2 &&
    typeof envelope.accessToken === 'string' &&
    envelope.accessToken.length > 0 &&
    typeof envelope.refreshToken === 'string' &&
    envelope.refreshToken.length > 0
  );
}

function isSnapshot(value: unknown): value is AuthSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<AuthSnapshot>;
  return (
    Boolean(snapshot.user) &&
    Array.isArray(snapshot.availableTenants) &&
    typeof snapshot.requiresTenantSelection === 'boolean' &&
    Array.isArray(snapshot.availableContexts) &&
    typeof snapshot.requiresContextSelection === 'boolean'
  );
}

export const authSessionStorageService = {
  tokens: {
    async read(): Promise<AuthTokens | null> {
      const raw = await secureStorage.get(authStorageKeys.tokens);
      if (!raw) return null;

      try {
        const envelope: unknown = JSON.parse(raw);
        if (!isTokenEnvelope(envelope)) {
          await this.clear();
          return null;
        }
        return {
          accessToken: envelope.accessToken,
          refreshToken: envelope.refreshToken,
        };
      } catch {
        await this.clear();
        return null;
      }
    },

    async write(tokens: AuthTokens): Promise<void> {
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Both access and refresh tokens are required.');
      }
      const envelope: TokenEnvelope = { version: 2, ...tokens };
      await secureStorage.set(authStorageKeys.tokens, JSON.stringify(envelope));
    },

    clear(): Promise<void> {
      return secureStorage.remove(authStorageKeys.tokens);
    },
  },

  snapshot: {
    async read(): Promise<AuthSnapshot | null> {
      const raw = await keyValueStorage.get(authStorageKeys.snapshot);
      if (!raw) return null;
      try {
        const envelope = JSON.parse(raw) as Partial<SnapshotEnvelope>;
        return envelope.version === 2 && isSnapshot(envelope.snapshot)
          ? normalizeSnapshot(envelope.snapshot)
          : null;
      } catch {
        return null;
      }
    },

    write(snapshot: AuthSnapshot): Promise<void> {
      const envelope: SnapshotEnvelope = {
        version: 2,
        snapshot: normalizeSnapshot(snapshot),
      };
      return keyValueStorage.set(authStorageKeys.snapshot, JSON.stringify(envelope));
    },

    clear(): Promise<void> {
      return keyValueStorage.remove(authStorageKeys.snapshot);
    },
  },

  async migrateLegacyKeys(): Promise<void> {
    const migrated = await keyValueStorage.get(authStorageKeys.migration);
    if (migrated === '2') return;
    await Promise.allSettled([
      secureStorage.remove('auth.tokens.v1'),
      keyValueStorage.removeMany(legacyAuthKeys),
    ]);
    await keyValueStorage.set(authStorageKeys.migration, '2');
  },

  async clear(): Promise<void> {
    await Promise.all([this.tokens.clear(), this.snapshot.clear()]);
  },
};
