import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiUrl } from '../api/client.js'
import RepoList from '../components/RepoList.jsx'
import AddRepoModal from '../components/AddRepoModal.jsx'

export default function ProjectPage() {
  const { projectId } = useParams()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [showAddRepo, setShowAddRepo] = useState(false)
  const queryClient = useQueryClient()
  const answerRef = useRef(null)

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiFetch(`/projects/${projectId}`),
    refetchInterval: 15000,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['history', projectId],
    queryFn: () => apiFetch(`/ask/history?projectId=${projectId}`),
  })

  useEffect(() => {
    if (answerRef.current) answerRef.current.scrollTop = answerRef.current.scrollHeight
  }, [answer])

  async function handleAsk(e) {
    e.preventDefault()
    if (!question.trim() || streaming) return

    setStreaming(true)
    setAnswer('')
    setSources([])

    const res = await fetch(apiUrl('/ask'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, question, userId: 'local-user' }),
    })

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const event = JSON.parse(line.slice(6))
        if (event.type === 'delta') setAnswer(a => a + event.text)
        if (event.type === 'done') {
          setSources(event.sources)
          queryClient.invalidateQueries(['history', projectId])
        }
      }
    }

    setStreaming(false)
    setQuestion('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-blue-600">GitDoc</span>
          {project && (
            <span className="ml-3 text-gray-700 font-medium">{project.name}</span>
          )}
        </div>
        <button
          onClick={() => setShowAddRepo(true)}
          className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Add repo
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: repos */}
        <div className="lg:col-span-1">
          <RepoList repos={project?.repos ?? []} projectId={projectId} />
        </div>

        {/* Right: Q&A */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ask form */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Ask a question</h2>
            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What does the auth service do?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={streaming}
              />
              <button
                type="submit"
                disabled={streaming || !question.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {streaming ? '…' : 'Ask'}
              </button>
            </form>

            {/* Streaming answer */}
            {(answer || streaming) && (
              <div className="mt-4">
                <div
                  ref={answerRef}
                  className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto"
                >
                  {answer}
                  {streaming && <span className="animate-pulse">▋</span>}
                </div>
                {sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sources.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                        {s.filePath}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Q&A History */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Team Q&amp;A history</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No questions asked yet. Ask something above!</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {history.map(item => (
                  <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">{item.question}</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{item.answer}</p>
                    {Array.isArray(item.sources) && item.sources.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.sources.map((s, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                            {s.filePath}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddRepo && (
        <AddRepoModal
          projectId={projectId}
          onClose={() => setShowAddRepo(false)}
          onAdded={() => {
            queryClient.invalidateQueries(['project', projectId])
            setShowAddRepo(false)
          }}
        />
      )}
    </div>
  )
}
