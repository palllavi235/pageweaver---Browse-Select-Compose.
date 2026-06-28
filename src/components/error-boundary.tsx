import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Brand } from './brand'
import { Button } from './ui'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { error: Error | null }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch() {
    // Production error reporting can be connected here without including document data.
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="paper-grid grid min-h-screen place-items-center bg-paper p-5">
        <div className="max-w-lg rounded-3xl border bg-surface p-8 text-center shadow-lift sm:p-10">
          <Brand className="mb-10 justify-center" />
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f5e1dd] text-danger">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold">PageWeaver hit a loose thread.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your source files were not changed. Reload the workspace to recover the interface.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" /> Reload PageWeaver
          </Button>
        </div>
      </main>
    )
  }
}
