import { useState } from 'react'
import { api } from '../api'
import ErrorBoundary from './ErrorBoundary'

function CrashingWidget() {
  throw new Error('Test render error: this component crashed on purpose')
}

// Buttons that cause each kind of error, so the error handling can be checked end to end.
// API errors are already recorded by api.js, so the catch blocks only stop them propagating.
export default function ErrorTestPanel() {
  const [crash, setCrash] = useState(false)
  const ignore = () => {}

  return (
    <section className="card">
      <h2>Test the error handling</h2>
      <p className="muted small">Each button causes a real error. Watch it appear in the Error Center below and in the Flask terminal.</p>

      <h3>Backend errors</h3>
      <div className="button-grid">
        <button type="button" className="danger" onClick={() => api.triggerServerError().catch(ignore)}>Server crash (500)</button>
        <button type="button" className="danger" onClick={() => api.callUnknownEndpoint().catch(ignore)}>Unknown endpoint (404)</button>
        <button type="button" className="danger" onClick={() => api.addInvalidBook().catch(ignore)}>Invalid book (400)</button>
      </div>

      <h3>Frontend errors</h3>
      <div className="button-grid">
        <button type="button" className="warning" onClick={() => setCrash(true)}>Component crash</button>
        <button
          type="button"
          className="warning"
          onClick={() => setTimeout(() => { throw new Error('Test runtime error from a button click') })}
        >
          JavaScript error
        </button>
        <button
          type="button"
          className="warning"
          onClick={() => Promise.reject(new Error('Test unhandled promise rejection'))}
        >
          Rejected promise
        </button>
      </div>

      <ErrorBoundary name="Test widget" onReset={() => setCrash(false)}>
        {crash && <CrashingWidget />}
      </ErrorBoundary>
    </section>
  )
}
