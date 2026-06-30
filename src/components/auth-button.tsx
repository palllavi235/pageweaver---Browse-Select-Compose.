import { LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, useToast } from './ui'
import { useAuthStore } from '@/store/use-auth-store'

type GoogleAuthButtonProps = {
  className?: string
  compact?: boolean
  redirectTo?: string
}

export function GoogleAuthButton({ className, compact = false, redirectTo }: GoogleAuthButtonProps) {
  const status = useAuthStore((state) => state.status)
  const session = useAuthStore((state) => state.session)
  const signIn = useAuthStore((state) => state.signIn)
  const error = useAuthStore((state) => state.error)
  const showToast = useToast()
  const navigate = useNavigate()

  const handleSignIn = async () => {
    if (session) {
      if (redirectTo) navigate(redirectTo)
      return
    }
    const succeeded = await signIn()
    if (succeeded) {
      showToast('Google Drive connected')
      if (redirectTo) navigate(redirectTo)
    } else {
      showToast(useAuthStore.getState().error ?? error ?? 'Google sign-in failed', 'error')
    }
  }

  return (
    <Button className={className} loading={status === 'loading'} onClick={handleSignIn}>
      <LogIn className="size-4" />
      {session ? 'Connected' : compact ? 'Connect' : 'Continue with Google'}
    </Button>
  )
}
