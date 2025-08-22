import React, { useState, useEffect } from 'react'
import {
  BarChart,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Users,
  FolderOpen,
  Clock,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  PieChart,
  Activity
} from 'lucide-react'

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedReport, setSelectedReport] = useState('overview')
  
  // Helper function to get current project for each assignee
  const getAssigneeCurrentProject = (assignee) => {
    const currentProjects = {
      'ADIP': 'N-Rich Tyres & Services',
      'ELYAS': 'Aman Autopart & Services', 
      'SYAHMI': 'Cyber Pitwork',
      'ALIP': 'Auto Garage II'
    }
    return currentProjects[assignee] || 'No current project'
  }
  const [reportData, setReportData] = useState({
    overview: {
      totalProjects: 0,
      completedProjects: 0,
      inProgressProjects: 0,
      notStartedProjects: 0,
      totalTeamMembers: 0,
      weeklyTarget: 0,
      weeklyCompleted: 0,
      averageCompletionTime: 0,
      efficiency: 0
    },
    projectsByStatus: [],
    teamPerformance: [],
    monthlyProgress: [],
    projectTypes: [],
    drawingCompletion: {},
    upcomingDeadlines: []
  })
  
  // Fetch real-time data from API
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Replace with actual API endpoints
        const response = await fetch('http://localhost:3001/api/reports')
        const data = await response.json()
        
        // Transform API data to match component structure
        const transformedData = {
          overview: {
            totalProjects: data.totalProjects || 0,
            completedProjects: data.completedProjects || 0,
            inProgressProjects: data.inProgressProjects || 0,
            notStartedProjects: data.notStartedProjects || 0,
            totalTeamMembers: 4,
            weeklyTarget: 8,
            weeklyCompleted: data.monthlyCompleted || 0,
            averageCompletionTime: 18,
            efficiency: 89.2
          },
          projectsByStatus: [
            { status: 'Completed', count: data.completedProjects || 0, percentage: Math.round(((data.completedProjects || 0) / (data.totalProjects || 1)) * 100), color: 'bg-success-500' },
            { status: 'In Progress', count: data.inProgressProjects || 0, percentage: Math.round(((data.inProgressProjects || 0) / (data.totalProjects || 1)) * 100), color: 'bg-warning-500' },
            { status: 'Not Started', count: data.notStartedProjects || 0, percentage: Math.round(((data.notStartedProjects || 0) / (data.totalProjects || 1)) * 100), color: 'bg-gray-400' }
          ],
          teamPerformance: (data.teamPerformance || []).map(member => ({
            name: member.assignee,
            completed: member.completed_projects,
            target: member.total_assigned,
            efficiency: Math.round((member.completed_projects / member.total_assigned) * 100),
            avgTime: 18,
            currentProject: getAssigneeCurrentProject(member.assignee)
          })),
          monthlyProgress: [
            { month: 'Sep', completed: 12, target: 16 },
            { month: 'Oct', completed: 15, target: 16 },
            { month: 'Nov', completed: 14, target: 16 },
            { month: 'Dec', completed: 16, target: 16 }
          ],
          projectTypes: [
            { type: '2D Drawings', count: data.completedProjects || 0, percentage: 65 },
            { type: '3D Models', count: Math.floor((data.inProgressProjects || 0) / 2), percentage: 25 },
            { type: 'Revisions', count: Math.floor((data.notStartedProjects || 0) / 4), percentage: 10 }
          ],
          drawingCompletion: {
            '2D Drawings': { completed: 85, total: 100 },
            '3D Models': { completed: 72, total: 100 },
            'Technical Specs': { completed: 91, total: 100 },
            'Site Plans': { completed: 78, total: 100 }
          },
          upcomingDeadlines: [
            { project: 'N-Rich Tyres & Services', assignee: 'ADIP', deadline: '2024-01-15', priority: 'high' },
            { project: 'Aman Autopart & Services', assignee: 'ELYAS', deadline: '2024-01-18', priority: 'medium' },
            { project: 'Cyber Pitwork', assignee: 'SYAHMI', deadline: '2024-01-20', priority: 'medium' },
            { project: 'Auto Garage II', assignee: 'ALIP', deadline: '2024-01-22', priority: 'low' }
          ]
        }
        
        setReportData(transformedData)
      } catch (error) {
        console.error('Error fetching report data:', error)
        // Fallback to hardcoded data if API fails
        setReportData({
          overview: {
            totalProjects: 46,
            completedProjects: 15, // 14 approved + 1 OD Tune
            inProgressProjects: 11, // 7 with 2D completed + 4 currently working
            notStartedProjects: 20,
            totalTeamMembers: 4,
            weeklyTarget: 8,
            weeklyCompleted: 4, // Current active projects
            averageCompletionTime: 18,
            efficiency: 89.2
          },
    projectsByStatus: [
      { status: 'Completed', count: 15, percentage: 33, color: 'bg-success-500' },
      { status: 'In Progress', count: 11, percentage: 24, color: 'bg-warning-500' },
      { status: 'Not Started', count: 20, percentage: 43, color: 'bg-gray-400' }
    ],
    teamPerformance: [
      { name: 'ADIP', completed: 12, target: 12, efficiency: 95, avgTime: 16, currentProject: 'N-Rich Tyres & Services' },
      { name: 'ELYAS', completed: 11, target: 12, efficiency: 92, avgTime: 17, currentProject: 'Aman Autopart & Services' },
      { name: 'SYAHMI', completed: 11, target: 12, efficiency: 92, avgTime: 18, currentProject: 'Cyber Pitwork' },
      { name: 'ALIP', completed: 10, target: 12, efficiency: 83, avgTime: 20, currentProject: 'Auto Garage II' }
    ],
    monthlyProgress: [
      { month: 'Sep', completed: 12, target: 16 },
      { month: 'Oct', completed: 15, target: 16 },
      { month: 'Nov', completed: 14, target: 16 },
      { month: 'Dec', completed: 16, target: 16 },
      { month: 'Jan', completed: 7, target: 8 }
    ],
    projectTypes: [
      { type: 'Office Renovation', count: 8, percentage: 27 },
      { type: 'Restaurant/Kitchen', count: 6, percentage: 20 },
      { type: 'Retail Store', count: 5, percentage: 17 },
      { type: 'Medical Facility', count: 4, percentage: 13 },
      { type: 'Hotel/Hospitality', count: 4, percentage: 13 },
      { type: 'Warehouse/Industrial', count: 3, percentage: 10 }
    ],
    drawingCompletion: {
      '2D Drawings': {
        total: 782, // 46 projects * 17 drawings each
        completed: 374, // 15 completed + 8 with 2D finished = 23 * 17 - some partial
        percentage: 48
      },
      '3D Models': {
        total: 138, // 46 projects * 3 models each
        completed: 45, // Only completed projects have 3D
        percentage: 33
      }
    },
    upcomingDeadlines: [
      { project: 'N-Rich Tyres & Services', assignee: 'ADIP', dueDate: '2024-01-25', daysLeft: 6, status: 'warning' },
      { project: 'Aman Autopart & Services', assignee: 'ELYAS', dueDate: '2024-01-28', daysLeft: 9, status: 'normal' },
      { project: 'Cyber Pitwork', assignee: 'SYAHMI', dueDate: '2024-02-02', daysLeft: 14, status: 'normal' },
          { project: 'Auto Garage II', assignee: 'ALIP', dueDate: '2024-02-05', daysLeft: 17, status: 'normal' }
        ]
        })
      }
    }
    
    fetchReportData()
    
    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(fetchReportData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [selectedPeriod])
  
  const getDeadlineStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'text-danger-600 bg-danger-50'
      case 'warning': return 'text-warning-600 bg-warning-50'
      case 'normal': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const exportReport = () => {
    // In real app, this would generate and download a PDF/Excel report
    alert('Report export functionality would be implemented here')
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into team performance and project progress</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={exportReport}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Report Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart },
          { id: 'team', label: 'Team Performance', icon: Users },
          { id: 'projects', label: 'Project Analysis', icon: FolderOpen },
          { id: 'deadlines', label: 'Deadlines', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                selectedReport === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
      
      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.completedProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Activity className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.inProgressProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.efficiency}%</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Status Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Status Distribution</h3>
              <div className="space-y-4">
                {reportData.projectsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-gray-700">{item.status}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Monthly Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Progress</h3>
              <div className="space-y-4">
                {reportData.monthlyProgress.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium w-12">{month.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Completed: {month.completed}</span>
                        <span>Target: {month.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            month.completed >= month.target ? 'bg-success-500' : 'bg-warning-500'
                          }`}
                          style={{ width: `${(month.completed / month.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {Math.round((month.completed / month.target) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Drawing Completion Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Drawing Completion Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(reportData.drawingCompletion).map(([type, data]) => (
                <div key={type} className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">{type}</h4>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary-600"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${data.percentage}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{data.percentage}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {data.completed} of {data.total} completed
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Team Performance Report */}
      {selectedReport === 'team' && (
        <div className="space-y-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Performance Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Team Member</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Completed</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Target</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Efficiency</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Avg Time (Days)</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.teamPerformance.map((member, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-lg font-semibold text-gray-900">{member.completed}</span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-gray-600">{member.target}</span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`font-medium ${
                          member.efficiency >= 90 ? 'text-success-600' :
                          member.efficiency >= 80 ? 'text-warning-600' : 'text-danger-600'
                        }`}>
                          {member.efficiency}%
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-gray-600">{member.avgTime}</span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mx-auto">
                          <div 
                            className={`h-2 rounded-full ${
                              (member.completed / member.target) >= 1 ? 'bg-success-500' :
                              (member.completed / member.target) >= 0.75 ? 'bg-warning-500' : 'bg-danger-500'
                            }`}
                            style={{ width: `${Math.min((member.completed / member.target) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Analysis Report */}
      {selectedReport === 'projects' && (
        <div className="space-y-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Types Distribution</h3>
            <div className="space-y-4">
              {reportData.projectTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{type.type}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${type.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {type.count}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {type.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Deadlines Report */}
      {selectedReport === 'deadlines' && (
        <div className="space-y-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {reportData.upcomingDeadlines.map((deadline, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  deadline.status === 'urgent' ? 'border-danger-500 bg-danger-50' :
                  deadline.status === 'warning' ? 'border-warning-500 bg-warning-50' :
                  'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{deadline.project}</h4>
                      <p className="text-sm text-gray-600">Assigned to: {deadline.assignee}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{deadline.dueDate}</p>
                      <p className={`text-sm ${
                        deadline.status === 'urgent' ? 'text-danger-600' :
                        deadline.status === 'warning' ? 'text-warning-600' :
                        'text-gray-600'
                      }`}>
                        {deadline.daysLeft} days left
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports