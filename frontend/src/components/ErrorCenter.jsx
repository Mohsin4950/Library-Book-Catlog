import { useEffect, useState, useSyncExternalStore } from 'react'
import { api } from '../api'
import { clearFrontendErrors, getErrors, subscribe } from '../errorStore'

const POLL_MS = 5000

function time(iso) {
  return new Date(iso).toLocaleTimeString()
}

function ErrorRow({ entry, highlighted, children }) {
  return (
    <li id={`error-${entry.id}`} className={`error-row ${highlighted ? 'highlight' : ''}`}>
      <div className="error-meta">
        <code className="error-id">{entry.id}</code>
        <span className="muted small">{time(entry.timestamp)}</span>
        {entry.source && <span className={`badge source-${entry.source}`}>{entry.source}</span>}
        <span className="badge kind">{entry.kind}</span>
        {entry.status && <span className={`badge status ${entry.status >= 500 ? 's5' : 's4'}`}>{entry.status}</span>}
        {entry.method && <code className="muted small">{entry.method} {entry.path}</code>}
      </div>
      <div className="error-message">{entry.message}</div>
      {children}
      {entry.details && (
        <details>
          <summary>Details</summary>
          <pre>{entry.details}</pre>
        </details>
      )}
    </li>
  )
}

// /ui/#frontend-errors and /ui/#backend-errors open the matching tab
function tabFromHash() {
  return { '#frontend-errors': 'frontend', '#backend-errors': 'backend' }[window.location.hash] || null
}

function scrollToErrorCenter(behavior = 'smooth') {
  document.getElementById('error-center')?.scrollIntoView({ behavior, block: 'start' })
}

function IdLink({ id, onJump }) {
  return <button type="button" className="link" onClick={() => onJump(id)}>{id}</button>
}

// Shows frontend errors (this browser) and the backend error log side by side
export default function ErrorCenter() {
  const frontendErrors = useSyncExternalStore(subscribe, getErrors)
  const [tab, setTab] = useState(() => tabFromHash() || 'frontend')
  const [backend, setBackend] = useState({ errors: [], loadedAt: null, loadError: null })
  const [sourceFilter, setSourceFilter] = useState('backend')
  const [highlightId, setHighlightId] = useState(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const refreshBackend = () => setRefreshCount((n) => n + 1)

  // Poll GET /api/errors; also reload at once when Refresh is pressed or a frontend error is reported
  const reportKey = frontendErrors.map((e) => `${e.id}:${e.reportStatus}`).join(',')
  useEffect(() => {
    let active = true
    const load = () =>
      api.listBackendErrors().then(
        (data) => active && setBackend({ errors: data.errors, loadedAt: new Date(), loadError: null }),
        (err) => active && setBackend((prev) => ({ ...prev, loadError: err.message })),
      )
    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [reportKey, refreshCount])

  // Follow the URL hash: on page load and whenever a #frontend-errors / #backend-errors link is opened
  useEffect(() => {
    if (tabFromHash()) {
      // Stop the browser restoring the old scroll position over ours after a reload
      window.history.scrollRestoration = 'manual'
      requestAnimationFrame(() => scrollToErrorCenter('auto'))
    }
    const onHashChange = () => {
      const fromHash = tabFromHash()
      if (!fromHash) return
      setTab(fromHash)
      scrollToErrorCenter()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectTab = (next) => {
    setTab(next)
    window.history.replaceState(null, '', `#${next}-errors`)
  }

  const jumpTo = (id) => {
    selectTab(id.startsWith('FE-') ? 'frontend' : 'backend')
    setSourceFilter('all')
    setHighlightId(id)
    setTimeout(() => document.getElementById(`error-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  async function clearBackend() {
    try {
      await api.clearBackendErrors()
    } catch {
      // already recorded as a frontend error by api.js
    }
    refreshBackend()
  }

  const backendVisible = backend.errors.filter((e) => sourceFilter === 'all' || e.source === sourceFilter)
  // Frontend errors saved in the backend log that are not in this browser's list (e.g. from before a reload)
  const reportedHere = new Set(frontendErrors.map((e) => e.backendId))
  const savedFrontend = backend.errors.filter((e) => e.source === 'frontend' && !reportedHere.has(e.id))
  const backendOnlyCount = backend.errors.filter((e) => e.source === 'backend').length

  return (
    <section className="card error-center" id="error-center">
      <div className="card-head">
        <h2>Error Center</h2>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'frontend'} className={tab === 'frontend' ? 'active' : ''} onClick={() => selectTab('frontend')}>
            Frontend errors <span className="count">{frontendErrors.length + savedFrontend.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'backend'} className={tab === 'backend' ? 'active' : ''} onClick={() => selectTab('backend')}>
            Backend errors <span className="count">{backendOnlyCount}</span>
          </button>
        </div>
      </div>

      {tab === 'frontend' && (
        <>
          <div className="toolbar">
            <span className="muted small">
              Errors caught in the browser: failed API calls, crashed components, JavaScript errors. Each one is also sent to the backend (<a href="/api/errors/frontend" target="_blank" rel="noreferrer">/api/errors/frontend</a>).
            </span>
            <div className="spacer" />
            <button type="button" className="secondary" onClick={clearFrontendErrors} disabled={frontendErrors.length === 0}>Clear this list</button>
          </div>
          {frontendErrors.length === 0 && savedFrontend.length === 0 && <p className="muted empty">No frontend errors so far.</p>}
          {frontendErrors.length > 0 && (
            <ul className="error-list">
              {frontendErrors.map((entry) => (
                <ErrorRow key={entry.id} entry={entry} highlighted={entry.id === highlightId}>
                  <div className="links small">
                    {entry.relatedErrorId && <span>Backend error: <IdLink id={entry.relatedErrorId} onJump={jumpTo} /></span>}
                    {entry.reportStatus === 'sent' && <span>Reported to backend as <IdLink id={entry.backendId} onJump={jumpTo} /></span>}
                    {entry.reportStatus === 'sending' && <span className="muted">Reporting to backend…</span>}
                    {entry.reportStatus === 'failed' && <span className="field-error">Could not report to backend (is it running?)</span>}
                  </div>
                </ErrorRow>
              ))}
            </ul>
          )}
          {savedFrontend.length > 0 && (
            <>
              <h3>Reported earlier (saved in the backend log)</h3>
              <ul className="error-list">
                {savedFrontend.map((entry) => (
                  <ErrorRow key={entry.id} entry={entry} highlighted={entry.id === highlightId}>
                    {entry.related_error_id && (
                      <div className="links small">Backend error: <IdLink id={entry.related_error_id} onJump={jumpTo} /></div>
                    )}
                  </ErrorRow>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === 'backend' && (
        <>
          <div className="toolbar">
            <label className="small">
              Show{' '}
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="backend">backend errors</option>
                <option value="frontend">reported by frontend</option>
                <option value="all">all</option>
              </select>
            </label>
            <span className="muted small">
              <a href={sourceFilter === 'all' ? '/api/errors' : `/api/errors/${sourceFilter}`} target="_blank" rel="noreferrer">
                {sourceFilter === 'all' ? '/api/errors' : `/api/errors/${sourceFilter}`}
              </a>
              {backend.loadedAt ? ` - updated ${backend.loadedAt.toLocaleTimeString()}` : ' - loading…'}
            </span>
            <div className="spacer" />
            <button type="button" className="secondary" onClick={refreshBackend}>Refresh</button>
            <button type="button" className="secondary" onClick={clearBackend} disabled={backend.errors.length === 0}>Clear log</button>
          </div>
          {backend.loadError && <div className="inline-error" role="alert">Cannot load the backend error log: {backend.loadError}</div>}
          {backendVisible.length === 0 ? (
            <p className="muted empty">No errors in the backend log.</p>
          ) : (
            <ul className="error-list">
              {backendVisible.map((entry) => (
                <ErrorRow key={entry.id} entry={entry} highlighted={entry.id === highlightId}>
                  {entry.related_error_id && (
                    <div className="links small">Related backend error: <IdLink id={entry.related_error_id} onJump={jumpTo} /></div>
                  )}
                </ErrorRow>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
