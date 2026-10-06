// Frontend error store.
// Keeps every error seen in this browser (for the Error Center) and reports each one
// to the backend through POST /api/errors, so it also appears in the backend log.

const MAX_ERRORS = 100

let errors = []
let nextId = 1
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function update(id, changes) {
  errors = errors.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))
  emit()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getErrors() {
  return errors
}

export function clearFrontendErrors() {
  errors = []
  emit()
}

export function recordError({ kind, message, details, status, method, path, relatedErrorId }) {
  const entry = {
    id: `FE-${String(nextId++).padStart(4, '0')}`,
    timestamp: new Date().toISOString(),
    kind: kind || 'unknown',
    message: String(message || 'Unknown error'),
    details: details ? String(details) : null,
    status: status ?? null,
    method: method || null,
    path: path || null,
    relatedErrorId: relatedErrorId || null,
    backendId: null,
    reportStatus: 'sending',
  }
  errors = [entry, ...errors].slice(0, MAX_ERRORS)
  console.error(`[${entry.id}] ${entry.kind}: ${entry.message}`, entry.details ?? '')
  emit()
  reportToBackend(entry)
  return entry
}

async function reportToBackend(entry) {
  try {
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: entry.kind,
        message: entry.message,
        details: entry.details,
        status: entry.status,
        method: entry.method,
        path: entry.path ?? window.location.pathname,
        related_error_id: entry.relatedErrorId,
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const saved = await response.json()
    update(entry.id, { backendId: saved.id, reportStatus: 'sent' })
  } catch (err) {
    // Plain console output only: reporting this failure would loop back into the store
    console.error(`[${entry.id}] could not be reported to the backend:`, err)
    update(entry.id, { reportStatus: 'failed' })
  }
}

// Errors that nothing else catches: exceptions in event handlers/timers and rejected promises
export function installGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    recordError({
      kind: 'runtime',
      message: event.error?.message || event.message,
      details: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    recordError({
      kind: 'unhandled-promise',
      message: reason?.message || String(reason),
      details: reason?.stack,
    })
  })
}
