import { create } from 'zustand'
import { javaApi } from '../../lib/javaApi'

export type UserContext = { userPersonId: string; fullName?: string; personCode?: string; roleCodes?: string[] }
export type AuthSnapshot = {
  accessToken: string | null
  user: { userId: string; phoneNumber: string; roleCodes: string[]; permissionCodes: string[] } | null
  activeContext: UserContext | null
  availableContexts: UserContext[]
  requiresContextSelection: boolean
  status: 'bootstrapping' | 'anonymous' | 'selecting-context' | 'authenticated'
}

type AuthResponse = Omit<AuthSnapshot, 'status'> & { accessToken: string }
type AuthStore = AuthSnapshot & {
  apply: (response: AuthResponse) => void
  anonymous: () => void
}

const installationKey = 'tkd-web-installation-id'
function installationId() {
  const saved = localStorage.getItem(installationKey)
  if (saved) return saved
  const next = crypto.randomUUID()
  localStorage.setItem(installationKey, next)
  return next
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  activeContext: null,
  availableContexts: [],
  requiresContextSelection: false,
  status: 'bootstrapping',
  apply: (response) => set({
    accessToken: response.accessToken,
    user: response.user,
    activeContext: response.activeContext,
    availableContexts: response.availableContexts ?? [],
    requiresContextSelection: response.requiresContextSelection,
    status: response.requiresContextSelection ? 'selecting-context' : 'authenticated',
  }),
  anonymous: () => set({
    accessToken: null,
    user: null,
    activeContext: null,
    availableContexts: [],
    requiresContextSelection: false,
    status: 'anonymous',
  }),
}))

async function refreshAccessToken() {
  const { data } = await javaApi.client.post<AuthResponse>('/auth/refresh')
  useAuthStore.getState().apply(data)
  return data.accessToken
}

javaApi.configureAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken,
  invalidateSession: async () => useAuthStore.getState().anonymous(),
})

export const auth = {
  async bootstrap() {
    try {
      await refreshAccessToken()
    } catch {
      useAuthStore.getState().anonymous()
    }
  },
  async login(phoneNumber: string, password: string) {
    const { data } = await javaApi.client.post<AuthResponse>('/auth/login', {
      phoneNumber,
      password,
      idDevice: installationId(),
    })
    useAuthStore.getState().apply(data)
  },
  async switchContext(userPersonId: string) {
    const { data } = await javaApi.client.post<AuthResponse>('/auth/switch-context', { userPersonId })
    useAuthStore.getState().apply(data)
  },
  async logout() {
    try { await javaApi.client.post('/auth/logout') } finally { useAuthStore.getState().anonymous() }
  },
}
