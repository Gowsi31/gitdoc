import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'

export default function Landing() {
  const navigate = useNavigate()
  const [step, setStep] = useState('home') // home | create
  const [form, setForm] = useState({ workspaceName: '', projectName: '', gitUrl: '', isPrivate: false, accessToken: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Create workspace (simplified — no auth yet, using a stub owner)
      const workspace = await apiFetch('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: form.workspaceName, ownerId: 'local-user' }),
      })
      const project = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: workspace.id, name: form.projectName }),
      })
      await apiFetch('/repos', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          gitUrl: form.gitUrl,
          isPrivate: form.isPrivate,
          accessToken: form.isPrivate ? form.accessToken : undefined,
        }),
      })
      navigate(`/project/${project.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <button onClick={() => setStep('home')} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your project</h2>
          <p className="text-gray-500 text-sm mb-6">Connect a git repo and start asking questions.</p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team / workspace name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Acme Engineering"
                value={form.workspaceName}
                onChange={e => setForm(f => ({ ...f, workspaceName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. API Platform"
                value={form.projectName}
                onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Git repository URL</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="https://github.com/org/repo"
                value={form.gitUrl}
                onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isPrivate"
                type="checkbox"
                className="rounded"
                checked={form.isPrivate}
                onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700">Private repository</label>
            </div>
            {form.isPrivate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access token (read-only)</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="ghp_..."
                  value={form.accessToken}
                  onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                  required={form.isPrivate}
                />
                <p className="text-xs text-gray-400 mt-1">Stored encrypted with AES-256. Never sent to the frontend.</p>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Connecting repo…' : 'Connect repo & index docs'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-600">GitDoc</span>
        <button
          onClick={() => setStep('create')}
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get started free
        </button>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Free · $0/month to launch
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Your repo docs,{' '}
          <span className="text-blue-600">always live.</span>
          <br />Ask anything.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Connect any git repository. GitDoc reads all your markdown docs automatically and gives your whole team instant AI-powered answers — without asking a developer.
        </p>
        <button
          onClick={() => setStep('create')}
          className="bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          Connect your first repo →
        </button>
        <p className="text-sm text-gray-400 mt-4">No credit card · GitHub, GitLab, Bitbucket, self-hosted</p>
      </main>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Paste your repo URL', desc: 'Any provider. Public or private. GitDoc clones and reads all your .md files in under 2 minutes.' },
              { step: '2', title: 'Docs stay in sync', desc: 'Auto-syncs every 30 minutes via git pull. Always up to date, zero manual work.' },
              { step: '3', title: 'Your team asks anything', desc: 'AI answers with exact source file references. All Q&A is shared — the whole team learns together.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
