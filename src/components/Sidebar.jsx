import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  BarChart, 
  Settings, 
  Ruler,
  Target,
  Bot,
  FileText,
  Brain,
  MapPin
} from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Team Members', href: '/team', icon: Users },
    { name: 'AI Assistant', href: '/ai-chat', icon: Bot },
    { name: 'PDF Converter', href: '/pdf-converter', icon: FileText },
    { name: 'AI Drawing Checker', href: '/ai-drawing-checker', icon: Brain },
    { name: 'OSM Converter', href: '/osm-converter', icon: MapPin },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }
  
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
            <Ruler className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DrafTeam</h1>
            <p className="text-sm text-gray-500">Project Management</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* Weekly Target */}
      <div className="p-4 m-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
        <div className="flex items-center space-x-2 mb-2">
          <Target className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-900">Weekly Target</span>
        </div>
        <p className="text-xs text-primary-700 mb-2">2 projects per person</p>
        <div className="w-full bg-primary-200 rounded-full h-2">
          <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
        </div>
        <p className="text-xs text-primary-600 mt-1">6/8 completed this week</p>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2024 Draftman Team
        </p>
      </div>
    </div>
  )
}

export default Sidebar