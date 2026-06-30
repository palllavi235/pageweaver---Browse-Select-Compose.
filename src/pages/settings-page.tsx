import {
  Bell,
  Cloud,
  Database,
  Eraser,
  Keyboard,
  LogOut,
  Palette,
  RotateCcw,
  Shield,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { GoogleAuthButton } from '@/components/auth-button'
import { Badge, Button, Card, Dialog, Input, Tabs, useToast } from '@/components/ui'
import { clearPdfCache, getPdfCacheStats } from '@/features/pdf/pdf-cache-service'
import { useAuthStore } from '@/store/use-auth-store'
import { useGenerationStore } from '@/store/use-generation-store'
import { useLibraryStore } from '@/store/use-library-store'
import { useSettingsStore, type DensityPreference, type ThemePreference } from '@/store/use-settings-store'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { cn } from '@/utils/cn'
import { formatBytes } from '@/utils/format'

const themeOptions: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'paper', label: 'Warm paper', description: 'The signature calm PageWeaver palette.' },
  { value: 'ink', label: 'Ink room', description: 'A quiet dark workspace for long sessions.' },
  { value: 'system', label: 'System', description: 'Follow your operating system preference.' },
]

const densityOptions: Array<{ value: DensityPreference; label: string; description: string }> = [
  { value: 'comfortable', label: 'Comfortable', description: 'Generous whitespace for a calmer workspace.' },
  { value: 'compact', label: 'Compact', description: 'Tighter page spacing for smaller screens.' },
]

function PreferenceButton({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'rounded-2xl border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft',
        active && 'border-gold ring-2 ring-gold/20',
      )}
      onClick={onClick}
      type="button"
    >
      <span className="font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
    </button>
  )
}

export function SettingsPage() {
  const [tab, setTab] = useState('Account')
  const [cacheVersion, setCacheVersion] = useState(0)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const showToast = useToast()
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const theme = useSettingsStore((state) => state.theme)
  const density = useSettingsStore((state) => state.density)
  const reduceMotion = useSettingsStore((state) => state.reduceMotion)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const setDensity = useSettingsStore((state) => state.setDensity)
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion)
  const resetSettings = useSettingsStore((state) => state.resetSettings)
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace)
  const clearLibrary = useLibraryStore((state) => state.clearAll)
  const resetGeneration = useGenerationStore((state) => state.reset)
  const stats = getPdfCacheStats()

  const clearTemporaryData = () => {
    clearPdfCache()
    resetGeneration()
    setCacheVersion((value) => value + 1)
    showToast('Temporary PDF data cleared')
  }

  const clearLocalWorkspace = () => {
    resetWorkspace()
    resetGeneration()
    clearPdfCache()
    setCacheVersion((value) => value + 1)
    showToast('Current document cleared')
  }

  const clearLocalHistory = () => {
    clearLibrary()
    showToast('Local history cleared')
  }

  const handleSignOut = async () => {
    await signOut()
    setConfirmSignOut(false)
    showToast('Signed out of Google')
  }

  return (
    <div className="page-shell max-w-6xl py-7 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Settings</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Tune PageWeaver’s workspace, connected Drive account, privacy boundaries, and local performance cache.
          </p>
        </div>
        <Badge tone={session ? 'success' : 'neutral'}>{session ? 'Drive connected' : 'Not connected'}</Badge>
      </div>

      <div className="mt-7 overflow-x-auto">
        <Tabs tabs={['Account', 'Preferences', 'Privacy']} active={tab} onChange={setTab} />
      </div>

      {tab === 'Account' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-[#eee3d2] p-3 text-leather"><UserRound className="size-5" /></span>
              <div>
                <h3 className="font-display text-xl font-semibold">Personal details</h3>
                <p className="mt-1 text-sm text-muted">Profile details are read from your connected Google account.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              {session?.user.avatarUrl ? (
                <img alt="" className="size-16 rounded-full" src={session.user.avatarUrl} />
              ) : (
                <div className="grid size-16 place-items-center rounded-full bg-leather text-lg font-bold text-white">
                  {session?.user.name.slice(0, 2).toUpperCase() ?? 'PW'}
                </div>
              )}
              <div>
                <p className="font-semibold">{session?.user.name ?? 'Not signed in'}</p>
                <p className="mt-1 text-xs text-muted">{session?.user.email ?? 'Connect Google to load your profile.'}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input label="Display name" readOnly value={session?.user.name ?? ''} />
              <Input label="Email address" readOnly type="email" value={session?.user.email ?? ''} />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-[#e1e8dc] p-3 text-success"><Cloud className="size-5" /></span>
              <div>
                <h3 className="font-display text-xl font-semibold">Google Drive</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  PageWeaver uses read access for browsing PDFs and requests save permission only when you save a generated PDF.
                </p>
              </div>
            </div>
            {session ? (
              <div className="mt-6 space-y-4">
                <p className="rounded-2xl border bg-paper/60 p-4 text-sm text-muted">
                  Connected as <span className="font-medium text-ink">{session.user.email}</span>
                </p>
                <Button onClick={() => setConfirmSignOut(true)} variant="secondary"><LogOut className="size-4" /> Sign out</Button>
              </div>
            ) : (
              <div className="mt-6"><GoogleAuthButton /></div>
            )}
          </Card>
        </div>
      )}

      {tab === 'Preferences' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-[#eee3d2] p-3 text-leather"><Palette className="size-5" /></span>
              <div>
                <h3 className="font-display text-xl font-semibold">Appearance</h3>
                <p className="mt-1 text-sm text-muted">Keep the warm stationery identity while matching your working environment.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {themeOptions.map((option) => (
                <PreferenceButton
                  active={theme === option.value}
                  description={option.description}
                  key={option.value}
                  label={option.label}
                  onClick={() => setTheme(option.value)}
                />
              ))}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-[#f3e7cb] p-3 text-gold"><Bell className="size-5" /></span>
                <div>
                  <h3 className="font-display text-xl font-semibold">Workspace feel</h3>
                  <p className="mt-1 text-sm text-muted">Choose how much room PageWeaver gives your content.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {densityOptions.map((option) => (
                  <PreferenceButton
                    active={density === option.value}
                    description={option.description}
                    key={option.value}
                    label={option.label}
                    onClick={() => setDensity(option.value)}
                  />
                ))}
              </div>
              <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl border bg-paper/60 p-4">
                <span>
                  <span className="block text-sm font-semibold">Reduce decorative motion</span>
                  <span className="text-xs text-muted">Keep state changes clear while calming non-essential animation.</span>
                </span>
                <input checked={reduceMotion} className="size-4 accent-leather" onChange={(event) => setReduceMotion(event.target.checked)} type="checkbox" />
              </label>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-[#eee3d2] p-3 text-leather"><Keyboard className="size-5" /></span>
                <div>
                  <h3 className="font-display text-xl font-semibold">Keyboard shortcuts</h3>
                  <p className="mt-1 text-sm text-muted">Fast controls for composing without reaching for the mouse.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 text-sm">
                {[
                  ['Ctrl K', 'Focus workspace search'],
                  ['Ctrl Z', 'Undo workspace change'],
                  ['Ctrl Y', 'Redo workspace change'],
                  ['Ctrl D', 'Duplicate the active page group'],
                  ['Delete', 'Remove the active page group'],
                  ['Ctrl F', 'Focus workspace search'],
                  ['Ctrl Shift P', 'Toggle outline and preview mode'],
                  ['↑ / ↓', 'Move the active group'],
                  ['Space', 'Toggle workspace mode'],
                  ['Esc', 'Close composer or dialog'],
                ].map(([keys, description]) => (
                  <div className="flex items-center justify-between rounded-xl bg-paper/60 px-3 py-2" key={keys}>
                    <span className="text-muted">{description}</span>
                    <kbd className="rounded-md border bg-surface px-2 py-1 text-xs font-semibold">{keys}</kbd>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'Privacy' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-[#eadfd8] p-3 text-danger"><Shield className="size-5" /></span>
              <div>
                <h3 className="font-display text-xl font-semibold">Privacy model</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Source PDF bytes stay in memory, generated download links are object URLs, and workspace persistence stores metadata only.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-muted">
              <p className="rounded-2xl border bg-paper/60 p-4">No backend is included in this frontend build.</p>
              <p className="rounded-2xl border bg-paper/60 p-4">Generated PDFs are saved to Drive only after explicit confirmation.</p>
              <p className="rounded-2xl border bg-paper/60 p-4">Existing Drive files are never overwritten by PageWeaver.</p>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-[#eee3d2] p-3 text-leather"><Database className="size-5" /></span>
                <div>
                  <h3 className="font-display text-xl font-semibold">Temporary PDF cache</h3>
                  <p className="mt-1 text-sm text-muted">Used only to keep opened PDFs responsive during the current session.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-paper/60 p-4"><p className="text-xs text-muted">Files</p><p className="mt-1 font-semibold">{stats.files}</p></div>
                <div className="rounded-2xl border bg-paper/60 p-4"><p className="text-xs text-muted">Memory</p><p className="mt-1 font-semibold">{formatBytes(stats.bytes)}</p></div>
                <div className="rounded-2xl border bg-paper/60 p-4"><p className="text-xs text-muted">Limit</p><p className="mt-1 font-semibold">{stats.maxFiles} files / {formatBytes(stats.maxBytes)}</p></div>
              </div>
              <p className="sr-only" aria-live="polite">Cache view refreshed {cacheVersion} times.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={clearTemporaryData} variant="secondary"><Eraser className="size-4" /> Clear temporary PDF data</Button>
                <Button onClick={clearLocalWorkspace} variant="secondary"><RotateCcw className="size-4" /> Reset current document</Button>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h3 className="font-display text-xl font-semibold">Local device data</h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                Clear local recents, favorites, generated-history metadata, and preference settings for this browser.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={clearLocalHistory} variant="secondary">Clear local history</Button>
                <Button onClick={() => { resetSettings(); showToast('Preferences reset') }} variant="secondary">Reset preferences</Button>
              </div>
            </Card>
          </div>
        </div>
      )}
      <Dialog open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Sign out?">
        <p className="text-sm leading-6 text-muted">
          PageWeaver will disconnect Google Drive for this browser. Local workspace metadata remains on this device.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setConfirmSignOut(false)} variant="secondary">Cancel</Button>
          <Button onClick={() => void handleSignOut()} variant="danger"><LogOut className="size-4" /> Sign out</Button>
        </div>
      </Dialog>
    </div>
  )
}
