import { create } from 'zustand'

const STORAGE_KEY = 'pageweaver:settings:v1'

export type ThemePreference = 'paper' | 'ink' | 'system'
export type DensityPreference = 'comfortable' | 'compact'

type PersistedSettings = {
  version: 1
  theme: ThemePreference
  density: DensityPreference
  reduceMotion: boolean
}

type SettingsState = PersistedSettings & {
  setTheme: (theme: ThemePreference) => void
  setDensity: (density: DensityPreference) => void
  setReduceMotion: (reduceMotion: boolean) => void
  resetSettings: () => void
}

const defaults: PersistedSettings = {
  version: 1,
  theme: 'paper',
  density: 'comfortable',
  reduceMotion: false,
}

function loadSettings(): PersistedSettings {
  if (typeof window === 'undefined') return defaults
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as Partial<PersistedSettings>
    if (parsed.version !== 1) return defaults
    return {
      version: 1,
      theme: parsed.theme === 'ink' || parsed.theme === 'system' ? parsed.theme : 'paper',
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      reduceMotion: Boolean(parsed.reduceMotion),
    }
  } catch {
    return defaults
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...loadSettings(),
  setTheme: (theme) => set({ theme }),
  setDensity: (density) => set({ density }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  resetSettings: () => set(defaults),
}))

useSettingsStore.subscribe((state) => {
  if (typeof window === 'undefined') return
  const value: PersistedSettings = {
    version: 1,
    theme: state.theme,
    density: state.density,
    reduceMotion: state.reduceMotion,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
})
