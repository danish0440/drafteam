import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Users,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Target,
  Award,
  Activity,
  Presentation
} from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    notStartedProjects: 0,
    teamMembers: 4,
    weeklyTarget: 8,
    weeklyCompleted: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/projects')
        const projects = await response.json()
        
        const completedProjects = projects.filter(p => p.status === 'completed').length
        const inProgressProjects = projects.filter(p => p.status === 'in-progress').length
        const notStartedProjects = projects.filter(p => p.status === 'not-started').length
        
        setStats({
          totalProjects: projects.length,
          completedProjects,
          inProgressProjects,
          notStartedProjects,
          teamMembers: 4,
          weeklyTarget: 8,
          weeklyCompleted: inProgressProjects
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])
  
  const teamProgress = [
    { name: 'ADIP', completed: 12, target: 12, progress: 100, currentProject: 'N-Rich Tyres & Services' },
    { name: 'ELYAS', completed: 11, target: 12, progress: 92, currentProject: 'Aman Autopart & Services' },
    { name: 'SYAHMI', completed: 11, target: 12, progress: 92, currentProject: 'Cyber Pitwork' },
    { name: 'ALIP', completed: 10, target: 12, progress: 83, currentProject: 'Auto Garage II' }
  ]
  
  const recentProjects = [
    { id: 43, name: 'N-Rich Tyres & Services', status: 'in-progress', progress: 60, dueDate: '2024-05-20', assignee: 'ADIP' },
    { id: 45, name: 'Aman Autopart & Services', status: 'in-progress', progress: 55, dueDate: '2024-05-25', assignee: 'ELYAS' },
    { id: 23, name: 'Cyber Pitwork', status: 'in-progress', progress: 50, dueDate: '2024-06-01', assignee: 'SYAHMI' },
    { id: 44, name: 'Auto Garage II', status: 'in-progress', progress: 45, dueDate: '2024-06-05', assignee: 'ALIP' },
    { id: 42, name: 'Albin Workshop', status: 'in-progress', progress: 85, dueDate: '2024-05-15', assignee: 'SYAHMI' }
  ]
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-100'
      case 'in-progress': return 'text-warning-600 bg-warning-100'
      case 'not-started': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
  
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-success-500'
    if (progress >= 50) return 'bg-warning-500'
    return 'bg-gray-400'
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your team's progress overview.</p>
        </div>
        <Link 
          to="/presentation" 
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
        >
          <Presentation className="w-5 h-5 mr-2" />
          Executive Presentation
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Total Projects</p>
              <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
            </div>
            <FolderOpen className="w-8 h-8 text-primary-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completedProjects}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-white">{stats.inProgressProjects}</p>
            </div>
            <Clock className="w-8 h-8 text-warning-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-100 text-sm font-medium">Team Members</p>
              <p className="text-3xl font-bold text-white">{stats.teamMembers}</p>
            </div>
            <Users className="w-8 h-8 text-secondary-200" />
          </div>
        </div>
      </div>
      
      {/* Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary-600" />
              Weekly Target Progress
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">This Week's Goal</span>
              <span className="text-sm text-gray-500">{stats.weeklyCompleted}/{stats.weeklyTarget} projects</span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${getProgressColor((stats.weeklyCompleted / stats.weeklyTarget) * 100)}`}
                style={{ width: `${(stats.weeklyCompleted / stats.weeklyTarget) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {stats.weeklyTarget - stats.weeklyCompleted} more projects needed to reach weekly target
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary-600" />
              Overall Progress
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Project Completion</span>
              <span className="text-sm text-gray-500">{Math.round((stats.completedProjects / stats.totalProjects) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill bg-primary-600"
                style={{ width: `${(stats.completedProjects / stats.totalProjects) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {stats.totalProjects - stats.completedProjects} projects remaining
            </p>
          </div>
        </div>
      </div>
      
      {/* Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary-600" />
              Team Performance
            </h2>
          </div>
          <div className="space-y-4">
            {teamProgress.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.completed}/{member.target} projects</p>
                    <p className="text-xs text-primary-600">Current: {member.currentProject}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(member.progress)}`}
                      style={{ width: `${member.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{member.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-600" />
              Recent Projects
            </h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{project.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${project.status === 'completed' ? 'status-completed' : project.status === 'in-progress' ? 'status-in-progress' : 'status-not-started'}`}>
                      {project.status.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">Due: {project.dueDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{project.progress}%</p>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard