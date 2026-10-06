import { useState, useSyncExternalStore } from 'react'
import { getErrors, subscribe } from '../errorStore'

// Pops up the newest frontend error until it is dismissed
export default function ErrorBanner() {
  const errors = useSyncExternalStore(subscribe, getErrors)
  const [dismissedId, setDismissedId] = useState(null)
  const latest = errors[0]

  if (!latest || latest.id === dismissedId) return null
  return (
    <div className="banner" role="alert">
      <div>
        <strong>{latest.kind === 'network' ? 'Connection problem' : 'Something went wrong'}:</strong> {latest.message}
        <span className="muted small"> ({latest.id}{latest.relatedErrorId ? `, backend ${latest.relatedErrorId}` : ''})</span>
      </div>
      <div className="banner-actions">
        <a
          href="#frontend-errors"
          onClick={() => {
            // Already on #frontend-errors: no hashchange event, so scroll here
            if (window.location.hash === '#frontend-errors') {
              document.getElementById('error-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
        >
          View in Error Center
        </a>
        <button type="button" className="link" onClick={() => setDismissedId(latest.id)} aria-label="Dismiss">✕</button>
      </div>
    </div>
  )
}
