import { useState } from 'react'
import { apiFetch } from '../api/client.js'

export default function AddRepoModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ gitUrl: '', isPrivate: false, accessToken: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/repos', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          gitUrl: form.gitUrl,
          isPrivate: form.isPrivate,
          accessToken: form.isPrivate ? form.accessToken : undefined,
        }),
      })
      onAdded()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Add repository</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Git URL</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/org/repo"
              value={form.gitUrl}
              onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="modal-private"
              type="checkbox"
              className="rounded"
              checked={form.isPrivate}
              onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
            />
            <label htmlFor="modal-private" className="text-sm text-gray-700">Private repository</label>
          </div>
          {form.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access token</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ghp_..."
                value={form.accessToken}
                onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                required={form.isPrivate}
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
