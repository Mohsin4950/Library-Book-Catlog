import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { recordError } from '../errorStore'

const POLL_MS = 10000

// SCRUM-8: shows the result of GET /health, checked every 10 seconds
export default function HealthBadge() {
  const [state, setState] = useState({ status: 'checking', checkedAt: null })
  const wasUp = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      let up = false
      try {
        const data = await api.health()
        up = data.status === 'ok'
      } catch {
        up = false
      }
      if (cancelled) return
      // Record only the change from up to down, not every failed poll
      if (!up && wasUp.current !== false) {
        recordError({ kind: 'health', message: 'Health check failed: the API is not responding', method: 'GET', path: '/health' })
      }
      wasUp.current = up
      setState({ status: up ? 'up' : 'down', checkedAt: new Date() })
    }

    check()
    const timer = setInterval(check, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const label = { checking: 'Checking API…', up: 'API UP', down: 'API DOWN' }[state.status]
  return (
    <div className={`health health-${state.status}`} title="GET /health, checked every 10 seconds">
      <span className="dot" />
      <span>{label}</span>
      {state.checkedAt && <span className="muted small">{state.checkedAt.toLocaleTimeString()}</span>}
    </div>
  )
}
