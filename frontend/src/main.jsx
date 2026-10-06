import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { installGlobalErrorHandlers } from './errorStore.js'
import './styles.css'

installGlobalErrorHandlers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary name="The app">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
