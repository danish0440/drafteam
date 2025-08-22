import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TeamMembers from './pages/TeamMembers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Presentation from './pages/Presentation'
import AIChat from './pages/AIChat'
import PDFConverter from './pages/PDFConverter'
import AIDrawingChecker from './pages/AIDrawingChecker'
import OSMConverter from './pages/OSMConverter'

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/team" element={<TeamMembers />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/pdf-converter" element={<PDFConverter />} />
            <Route path="/ai-drawing-checker" element={<AIDrawingChecker />} />
            <Route path="/osm-converter" element={<OSMConverter />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/presentation" element={<Presentation />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App