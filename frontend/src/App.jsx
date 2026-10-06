import { useEffect, useState } from 'react'
import { api } from './api'
import AddBookForm from './components/AddBookForm'
import BookList from './components/BookList'
import ErrorBanner from './components/ErrorBanner'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorCenter from './components/ErrorCenter'
import ErrorTestPanel from './components/ErrorTestPanel'
import HealthBadge from './components/HealthBadge'

export default function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadCount, setReloadCount] = useState(0)

  // SCRUM-6: load the catalog on start and whenever Refresh is pressed
  useEffect(() => {
    let active = true
    api.listBooks().then(
      (data) => {
        if (!active) return
        setBooks(data)
        setLoadError(null)
        setLoading(false)
      },
      (err) => {
        if (!active) return
        setLoadError(err)
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [reloadCount])

  const reloadBooks = () => {
    setLoading(true)
    setReloadCount((n) => n + 1)
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Library Book Catalog</h1>
          <p className="muted">React frontend for the Flask API · Practical 10, B3-G1</p>
        </div>
        <HealthBadge />
      </header>

      <ErrorBanner />

      <main className="layout">
        <ErrorBoundary name="Book list">
          <BookList books={books} loading={loading} error={loadError} onRefresh={reloadBooks} />
        </ErrorBoundary>
        <div className="side">
          <ErrorBoundary name="Add book form">
            <AddBookForm onAdded={(book) => setBooks((prev) => [...prev, book])} />
          </ErrorBoundary>
          <ErrorTestPanel />
        </div>
      </main>

      <ErrorBoundary name="Error Center">
        <ErrorCenter />
      </ErrorBoundary>
    </div>
  )
}
