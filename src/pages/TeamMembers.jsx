import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  FolderOpen,
  BarChart
} from 'lucide-react'

const TeamMembers = () => {
  const [selectedMember, setSelectedMember] = useState(null)
  
  // Mock data - in real app this would come from API
  const teamMembers = [
    {
      id: 1,
      name: 'ADIP',
      role: 'Senior Draftsman',
      email: 'adip@company.com',
      phone: '+1 (555) 123-4567',
      avatar: null,
      joinDate: '2022-03-15',
      stats: {
        totalProjects: 12,
        completedProjects: 8,
        inProgressProjects: 3,
        weeklyTarget: 2,
        weeklyCompleted: 2,
        averageCompletionTime: 14, // days
        efficiency: 95
      },
      currentProjects: [
        { id: 1, name: 'Office Renovation - Floor 3', status: 'completed', progress: 100, dueDate: '2024-01-15' },
        { id: 5, name: 'Medical Clinic Layout', status: 'in-progress', progress: 30, dueDate: '2024-02-05' }
      ],
      skills: ['AutoCAD', '3D Modeling', 'Revit', 'SketchUp', 'Construction Plans'],
      recentActivity: [
        { date: '2024-01-19', action: 'Completed Office Renovation - Floor 3' },
        { date: '2024-01-18', action: 'Started Medical Clinic Layout project' },
        { date: '2024-01-15', action: 'Uploaded 3D model for Office Renovation' }
      ]
    },
    {
      id: 2,
      name: 'ELYAS',
      role: 'Junior Draftsman',
      email: 'elyas@company.com',
      phone: '+1 (555) 234-5678',
      avatar: null,
      joinDate: '2021-08-20',
      stats: {
        totalProjects: 15,
        completedProjects: 10,
        inProgressProjects: 2,
        weeklyTarget: 2,
        weeklyCompleted: 2,
        averageCompletionTime: 12,
        efficiency: 98
      },
      currentProjects: [
        { id: 2, name: 'Restaurant Kitchen Upgrade', status: 'in-progress', progress: 75, dueDate: '2024-01-20' },
        { id: 6, name: 'Hotel Lobby Renovation', status: 'not-started', progress: 0, dueDate: '2024-02-10' }
      ],
      skills: ['AutoCAD', 'Revit', 'MEP Systems', 'Project Management', 'Client Relations'],
      recentActivity: [
        { date: '2024-01-19', action: 'Updated Restaurant Kitchen Upgrade progress to 75%' },
        { date: '2024-01-18', action: 'Completed furniture plan for Restaurant Kitchen' },
        { date: '2024-01-17', action: 'Client meeting for Hotel Lobby Renovation' }
      ]
    },
    {
      id: 3,
      name: 'SYAHMI',
      role: 'Junior Draftsman',
      email: 'syahmi@company.com',
      phone: '+1 (555) 345-6789',
      avatar: null,
      joinDate: '2023-01-10',
      stats: {
        totalProjects: 8,
        completedProjects: 5,
        inProgressProjects: 2,
        weeklyTarget: 2,
        weeklyCompleted: 1,
        averageCompletionTime: 16,
        efficiency: 85
      },
      currentProjects: [
        { id: 3, name: 'Retail Store Redesign', status: 'in-progress', progress: 45, dueDate: '2024-01-25' }
      ],
      skills: ['AutoCAD', '3D Visualization', 'Retail Design', 'Space Planning'],
      recentActivity: [
        { date: '2024-01-18', action: 'Updated Retail Store Redesign drawings' },
        { date: '2024-01-16', action: 'Completed demolition plan for Retail Store' },
        { date: '2024-01-15', action: 'Started construction plan phase' }
      ]
    },
    {
      id: 4,
      name: 'ALIP',
      role: 'Junior Draftsman',
      email: 'alip@company.com',
      phone: '+1 (555) 456-7890',
      avatar: null,
      joinDate: '2023-09-05',
      stats: {
        totalProjects: 5,
        completedProjects: 3,
        inProgressProjects: 1,
        weeklyTarget: 2,
        weeklyCompleted: 1,
        averageCompletionTime: 18,
        efficiency: 78
      },
      currentProjects: [
        { id: 4, name: 'Warehouse Optimization', status: 'not-started', progress: 0, dueDate: '2024-02-01' }
      ],
      skills: ['AutoCAD', 'Basic 3D Modeling', 'Technical Drawing', 'Learning Revit'],
      recentActivity: [
        { date: '2024-01-17', action: 'Assigned to Warehouse Optimization project' },
        { date: '2024-01-15', action: 'Completed training on advanced AutoCAD features' },
        { date: '2024-01-12', action: 'Finished previous project ahead of schedule' }
      ]
    }
  ]
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'in-progress': return 'status-in-progress'
      case 'not-started': return 'status-not-started'
      default: return 'status-not-started'
    }
  }
  
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-success-500'
    if (progress >= 50) return 'bg-warning-500'
    return 'bg-gray-400'
  }
  
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-success-600'
    if (efficiency >= 80) return 'text-warning-600'
    return 'text-danger-600'
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
        <p className="text-gray-600">Manage team members and track individual performance</p>
      </div>
      
      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Target className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Weekly Target</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.reduce((sum, member) => sum + member.stats.weeklyCompleted, 0)}/
                {teamMembers.reduce((sum, member) => sum + member.stats.weeklyTarget, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.reduce((sum, member) => sum + member.stats.inProgressProjects, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(teamMembers.reduce((sum, member) => sum + member.stats.efficiency, 0) / teamMembers.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {teamMembers.map((member) => (
          <div key={member.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedMember(member)}>
            {/* Member Header */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
              <div className={`text-right`}>
                <p className={`text-sm font-medium ${getEfficiencyColor(member.stats.efficiency)}`}>
                  {member.stats.efficiency}%
                </p>
                <p className="text-xs text-gray-500">Efficiency</p>
              </div>
            </div>
            
            {/* Weekly Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Weekly Target</span>
                <span className="text-sm text-gray-500">
                  {member.stats.weeklyCompleted}/{member.stats.weeklyTarget}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getProgressColor((member.stats.weeklyCompleted / member.stats.weeklyTarget) * 100)}`}
                  style={{ width: `${(member.stats.weeklyCompleted / member.stats.weeklyTarget) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Project Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{member.stats.totalProjects}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-success-600">{member.stats.completedProjects}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-warning-600">{member.stats.inProgressProjects}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
            
            {/* Current Projects */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Current Projects:</p>
              <div className="space-y-2">
                {member.currentProjects.slice(0, 2).map((project) => (
                  <div key={project.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{project.name}</span>
                    <span className={`status-badge ${getStatusColor(project.status)} text-xs`}>
                      {project.progress}%
                    </span>
                  </div>
                ))}
                {member.currentProjects.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No active projects</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-2xl">
                      {selectedMember.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                    <p className="text-gray-600">{selectedMember.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Member Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact & Basic Info */}
                <div className="space-y-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedMember.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedMember.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">Joined: {selectedMember.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Performance Stats */}
                <div className="space-y-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.stats.efficiency}%</p>
                        <p className="text-sm text-gray-500">Efficiency</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.stats.averageCompletionTime}</p>
                        <p className="text-sm text-gray-500">Avg Days</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-success-600">{selectedMember.stats.completedProjects}</p>
                        <p className="text-sm text-gray-500">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-warning-600">{selectedMember.stats.inProgressProjects}</p>
                        <p className="text-sm text-gray-500">In Progress</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {selectedMember.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Projects */}
              <div className="mt-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Projects</h3>
                  <div className="space-y-3">
                    {selectedMember.currentProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-500">Due: {project.dueDate}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{project.progress}%</p>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`status-badge ${getStatusColor(project.status)}`}>
                            {project.status.replace('-', ' ')}
                          </span>
                          <Link 
                            to={`/projects/${project.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            onClick={() => setSelectedMember(null)}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                    {selectedMember.currentProjects.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No active projects</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamMembers