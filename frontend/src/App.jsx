import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProjectPage from './pages/ProjectPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/project/:projectId" element={<ProjectPage />} />
    </Routes>
  )
}
