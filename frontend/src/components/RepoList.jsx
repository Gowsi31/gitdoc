import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client.js'

export default function RepoList({ repos, projectId }) {
  const queryClient = useQueryClient()

  const sync = useMutation({
    mutationFn: (repoId) => apiFetch(`/repos/${repoId}/sync`, { method: 'POST' }),
    onSuccess: () => setTimeout(() => queryClient.invalidateQueries(['project', projectId]), 3000),
  })

  if (repos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 mb-2">Repositories</h2>
        <p className="text-sm text-gray-400">No repos connected yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="font-semibold text-gray-900 mb-3">Repositories</h2>
      <div className="space-y-3">
        {repos.map(repo => (
          <div key={repo.id} className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-mono text-gray-700 truncate mb-1">{repo.gitUrl}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {repo.docCount} docs
                {repo.lastSyncedAt && (
                  <span className="ml-2 text-gray-400">
                    synced {new Date(repo.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => sync.mutate(repo.id)}
                disabled={sync.isPending}
                className="text-xs text-blue-600 hover:underline disabled:opacity-40"
              >
                {sync.isPending ? 'Syncing…' : 'Re-sync'}
              </button>
            </div>
            {repo.syncError && (
              <p className="text-xs text-red-500 mt-1 truncate">{repo.syncError}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
