import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-500 mb-6">Workspace management will appear here once auth is added in Week 5.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline text-sm">← Back to home</button>
      </div>
    </div>
  )
}
