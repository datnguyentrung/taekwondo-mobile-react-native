import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch() {
    // The fallback is intentionally visible during development; Vite preserves
    // the original stack trace in the browser console.
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 24, color: '#991b1b', fontFamily: 'system-ui' }}>
          <h1>Web application could not render</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
        </main>
      )
    }
    return this.props.children
  }
}
