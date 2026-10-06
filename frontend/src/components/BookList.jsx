import { useState } from 'react'

// SCRUM-6: the catalog returned by GET /items
export default function BookList({ books, loading, error, onRefresh }) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = q
    ? books.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    : books

  return (
    <section className="card">
      <div className="card-head">
        <h2>Books <span className="count">{books.length}</span></h2>
        <button type="button" className="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <input
        type="search"
        className="search"
        placeholder="Search by title or author"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search books"
      />

      {error && (
        <div className="inline-error" role="alert">
          Could not load the catalog: {error.message}
          {error.errorId && <span className="muted"> (backend error {error.errorId})</span>}
        </div>
      )}

      {!error && !loading && visible.length === 0 && (
        <p className="muted empty">{books.length === 0 ? 'The catalog is empty.' : 'No books match your search.'}</p>
      )}

      {visible.length > 0 && (
        <table className="books">
          <thead>
            <tr><th>ID</th><th>Title</th><th>Author</th></tr>
          </thead>
          <tbody>
            {visible.map((book) => (
              <tr key={book.id}>
                <td className="muted">{book.id}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
