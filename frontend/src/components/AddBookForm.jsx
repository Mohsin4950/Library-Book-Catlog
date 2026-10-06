import { useState } from 'react'
import { api } from '../api'

const MAX_LENGTH = 200

function validate({ title, author }) {
  const errors = {}
  if (!title.trim()) errors.title = 'Title is required'
  else if (title.trim().length > MAX_LENGTH) errors.title = `At most ${MAX_LENGTH} characters`
  if (!author.trim()) errors.author = 'Author is required'
  else if (author.trim().length > MAX_LENGTH) errors.author = `At most ${MAX_LENGTH} characters`
  return errors
}

// SCRUM-7: POST /items
export default function AddBookForm({ onAdded }) {
  const [form, setForm] = useState({ title: '', author: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)

  const change = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setFieldErrors({ ...fieldErrors, [field]: undefined })
  }

  async function submit(e) {
    e.preventDefault()
    setSaved(null)
    setServerError(null)
    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const book = await api.addBook({ title: form.title.trim(), author: form.author.trim() })
      setSaved(book)
      setForm({ title: '', author: '' })
      onAdded(book)
    } catch (err) {
      setServerError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card">
      <h2>Add a book</h2>
      <form onSubmit={submit} noValidate>
        <label>
          Title
          <input value={form.title} onChange={change('title')} aria-invalid={Boolean(fieldErrors.title)} />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </label>
        <label>
          Author
          <input value={form.author} onChange={change('author')} aria-invalid={Boolean(fieldErrors.author)} />
          {fieldErrors.author && <span className="field-error">{fieldErrors.author}</span>}
        </label>
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add book'}</button>
      </form>

      {saved && <div className="inline-success">Added “{saved.title}” as book #{saved.id}.</div>}
      {serverError && (
        <div className="inline-error" role="alert">
          {serverError.message}
          {serverError.errorId && <span className="muted"> (backend error {serverError.errorId})</span>}
        </div>
      )}
    </section>
  )
}
