import { create } from 'zustand';

import type { AuthResponse } from '../api/auth.dto';
import { deriveAuthStatus } from '../domain/deriveAuthStatus';
import type {
  AuthSnapshot,
  AuthStatus,
  AuthUser,
  TenantInfo,
  UserContext,
} from '../domain/auth.types';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  activeTenant: TenantInfo | null;
  availableTenants: TenantInfo[];
  requiresTenantSelection: boolean;
  activeContext: UserContext | null;
  availableContexts: UserContext[];
  requiresContextSelection: boolean;
  status: AuthStatus;
  recoveryMessage: string | null;
  applyResponse: (response: AuthResponse, accessToken?: string) => void;
  hydrate: (accessToken: string, snapshot: AuthSnapshot) => void;
  updatePersonFaceImage: (personId: string, faceImagePath: string | null) => void;
  setAnonymous: () => void;
  setRecoverableError: (message: string) => void;
  setBootstrapping: () => void;
};

const EMPTY_AUTH = {
  accessToken: null,
  user: null,
  activeTenant: null,
  availableTenants: [] as TenantInfo[],
  requiresTenantSelection: false,
  activeContext: null,
  availableContexts: [] as UserContext[],
  requiresContextSelection: false,
  recoveryMessage: null,
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...EMPTY_AUTH,
  status: 'bootstrapping',

  applyResponse: (response, nextAccessToken) => {
    const accessToken = nextAccessToken ?? response.accessToken ?? get().accessToken;
    const activeTenant = response.activeTenant ?? null;
    const requiresTenantSelection = response.requiresTenantSelection ?? !activeTenant;
    const status = deriveAuthStatus(
      accessToken,
      response.user,
      response.activeContext,
      response.requiresContextSelection,
      activeTenant,
      requiresTenantSelection,
    );
    set({
      accessToken,
      user: response.user,
      activeTenant,
      availableTenants: response.availableTenants ?? [],
      requiresTenantSelection,
      activeContext: response.activeContext,
      availableContexts: response.availableContexts ?? [],
      requiresContextSelection: response.requiresContextSelection,
      status,
      recoveryMessage: null,
    });
  },

  hydrate: (accessToken, snapshot) => {
    const activeTenant = snapshot.activeTenant ?? null;
    const requiresTenantSelection = snapshot.requiresTenantSelection ?? !activeTenant;
    set({
      accessToken,
      user: snapshot.user,
      activeTenant,
      availableTenants: snapshot.availableTenants ?? [],
      requiresTenantSelection,
      activeContext: snapshot.activeContext,
      availableContexts: snapshot.availableContexts,
      requiresContextSelection: snapshot.requiresContextSelection,
      status: deriveAuthStatus(
        accessToken,
        snapshot.user,
        snapshot.activeContext,
        snapshot.requiresContextSelection,
        activeTenant,
        requiresTenantSelection,
      ),
      recoveryMessage: null,
    });
  },

  updatePersonFaceImage: (personId, faceImagePath) => {
    const updateContext = (context: UserContext | null) =>
      context?.personId === personId ? { ...context, faceImagePath } : context;
    set((state) => ({
      activeContext: updateContext(state.activeContext),
      availableContexts: state.availableContexts.map((context) =>
        updateContext(context)!,
      ),
    }));
  },

  setAnonymous: () => set({ ...EMPTY_AUTH, status: 'anonymous' }),
  setRecoverableError: (recoveryMessage) =>
    set({ status: 'recoverable-error', recoveryMessage }),
  setBootstrapping: () => set({ status: 'bootstrapping', recoveryMessage: null }),
}));

export const authStore = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getState: () => useAuthStore.getState(),
};

export const selectIsAuthenticated = (state: AuthState) =>
  state.status === 'authenticated'
  || state.status === 'selecting-context'
  || state.status === 'selecting-tenant';
export const selectCurrentUserId = (state: AuthState) => state.user?.userId ?? null;
export const selectCurrentTenantId = (state: AuthState) => state.activeTenant?.tenantId ?? null;
export const selectCurrentPersonId = (state: AuthState) =>
  state.activeContext?.personId ?? null;
export const selectCurrentContextType = (state: AuthState) =>
  state.activeContext?.relationshipType ?? null;
export const selectCurrentUserCode = (state: AuthState) =>
  state.activeContext?.personCode ?? undefined;
