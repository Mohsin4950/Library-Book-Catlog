import { Component } from 'react'
import { recordError } from '../errorStore'

// Catches errors thrown while React renders a component tree, records them
// and shows a fallback instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    recordError({
      kind: 'render',
      message: `${this.props.name || 'Component'} crashed: ${error.message}`,
      details: `${error.stack || error}\n\nComponent stack:${info.componentStack || ''}`,
    })
  }

  reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="boundary-fallback" role="alert">
        <strong>{this.props.name || 'This part of the page'} stopped working.</strong>
        <p>{this.state.error.message}</p>
        <p className="muted">The error was recorded in the Error Center and sent to the backend log.</p>
        <button type="button" onClick={this.reset}>Try again</button>
      </div>
    )
  }
}
