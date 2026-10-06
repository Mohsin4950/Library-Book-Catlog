// Small client for the Flask API. Every failed call is turned into an ApiError and,
// unless { record: false } is passed, recorded in the frontend error store.
import { recordError } from './errorStore'

export class ApiError extends Error {
  constructor(message, { status = null, errorId = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorId = errorId
  }
}

export async function apiRequest(method, path, body, { record = true } = {}) {
  const fail = (message, extra = {}) => {
    if (record) recordError({ kind: extra.kind || 'api', message, method, path, ...extra })
    return new ApiError(message, { status: extra.status, errorId: extra.relatedErrorId })
  }

  let response
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    throw fail(`Cannot reach the backend (${method} ${path}). Is the Flask server running?`, {
      kind: 'network',
      details: String(err),
    })
  }

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      data?.error ||
      `${method} ${path} failed with HTTP ${response.status}` +
        (data ? '' : ' (no JSON body - is the Flask backend running?)')
    throw fail(message, {
      status: response.status,
      relatedErrorId: data?.error_id,
      details: data ? null : text.slice(0, 1000) || null,
    })
  }
  if (data === null) {
    throw fail(`${method} ${path} returned a response that is not JSON`, {
      status: response.status,
      details: text.slice(0, 1000) || null,
    })
  }
  return data
}

export const api = {
  health: () => apiRequest('GET', '/health', undefined, { record: false }),
  listBooks: () => apiRequest('GET', '/items'),
  addBook: (book) => apiRequest('POST', '/items', book),
  listBackendErrors: () => apiRequest('GET', '/api/errors', undefined, { record: false }),
  clearBackendErrors: () => apiRequest('DELETE', '/api/errors'),
  // Used by the "Test the error handling" panel
  triggerServerError: () => apiRequest('POST', '/api/test-error'),
  callUnknownEndpoint: () => apiRequest('GET', '/api/does-not-exist'),
  addInvalidBook: () => apiRequest('POST', '/items', { title: 'A book without an author' }),
}
