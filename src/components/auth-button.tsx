import { LogIn } from 'lucide-react'
import { Button, useToast } from './ui'
import { useAuthStore } from '@/store/use-auth-store'

type GoogleAuthButtonProps = {
  className?: string
  compact?: boolean
}

export function GoogleAuthButton({ className, compact = false }: GoogleAuthButtonProps) {
  const status = useAuthStore((state) => state.status)
  const signIn = useAuthStore((state) => state.signIn)
  const error = useAuthStore((state) => state.error)
  const showToast = useToast()

  const handleSignIn = async () => {
    const succeeded = await signIn()
    if (succeeded) showToast('Google Drive connected')
    else showToast(useAuthStore.getState().error ?? error ?? 'Google sign-in failed', 'error')
  }

  return (
    <Button className={className} loading={status === 'loading'} onClick={handleSignIn}>
      <LogIn className="size-4" />
      {compact ? 'Connect' : 'Continue with Google'}
    </Button>
  )
}
